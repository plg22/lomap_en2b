import type { Landmark, Review }from "../shared/shareddtypes";
import { fetch } from "@inrupt/solid-client-authn-browser";

import {
    createThing, setThing, buildThing,
    getSolidDataset, saveSolidDatasetAt,
    createSolidDataset, getStringNoLocale,
    Thing, getThing, getThingAll,getUrl, 
    getUrlAll, getFile, isRawData, overwriteFile
  } from "@inrupt/solid-client";
  
  import { SCHEMA_INRUPT, RDF, FOAF, VCARD} from "@inrupt/vocab-common-rdf";
  
  import {v4 as uuid} from "uuid";


// Reading landmarks from POD

/**
 * Get all the landmarks from the pod
 * @param webID contains the user webID
 * @returns array of landmarks
 */
export async function getLandmarksPOD(webID:string | undefined) {
  if (webID === undefined) {
    //throw new Error("The user is not logged in");
    return;
  }
  let inventoryFolder = webID.split("profile")[0] + "public/lomap/inventory/index.ttl"; // inventory folder path
  let landmarks: Landmark[] = []; // initialize array of landmarks
  let landmarkPaths; 
  try {
    let dataSet = await getSolidDataset(inventoryFolder, {fetch: fetch}); // get the inventory dataset
    landmarkPaths = getThingAll(dataSet) // get the things from the dataset (landmark paths)
    
    const requests = landmarkPaths.map(landmarkPath => getLandmarkFromDataset(landmarkPath));
    
    const results = await Promise.allSettled(requests);
    const successfulResults = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.status === 'fulfilled' ? result.value : null)
    .filter(value => value !== null) as Landmark[];
    return successfulResults;

  } catch (error) {
    // if the landmark dataset does no exist, return empty array of landmarks
    landmarks = [];
  }
  // return the landmarks
  return landmarks;
}

/**
 * Retrieve the landmark from its dataset
 * @param landmarkPath contains the path of the landmark dataset
 * @returns landmark object
 */
export async function getLandmarkFromDataset(landmarkPath:any){
  let path = getStringNoLocale(landmarkPath, SCHEMA_INRUPT.identifier) as string;
  let datasetPath = path.split('#')[0] // get until index.ttl
  let landmarkDataset = await getSolidDataset(datasetPath, {fetch: fetch}) // get the whole dataset
  let landmarkAsThing = getThing(landmarkDataset, path) as Thing; // get the landmark as thing

  // retrieve landmark information
  let name = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.name) as string; 
  let longitude = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.longitude) as string; 
  let latitude = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.latitude) as string; 
  let description = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.description) as string; 
  let url = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.identifier) as string;
  let categoriesDeserialized = getStringNoLocale(landmarkAsThing, SCHEMA_INRUPT.Product) as string;

  let imagesUrl = datasetPath.slice(0,-9)+"images";//WORKING

 
  let pictures: string [] = []; // initialize array to store the images as strings
  pictures = await getLandmarkImage(imagesUrl); // get the images
  let reviews: Review[] = []; // initialize array to store the reviewsstring
  reviews = await getLandmarkReviews(datasetPath) // get the reviews
  let scores : Map<string, Array<Number>>; // map to store the ratingssendComme
  scores = await getLandmarkScores(datasetPath); // get the ratings

  let myScores = scores.get(name);
  

  // create Landmark object
  let landmark : Landmark = {
        name: name,
        category: categoriesDeserialized,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description,
        reviews: reviews,
        scores: myScores,
        pictures: pictures,
        url: url,
  }


  return landmark;
}

/**
 * Given the folder containing the images of the landmarks, gets the images (things) inside the dataset.
 * @param imagesFolderUrl url of the images folder
 * @returns string[] containing the images
 */
export async function getLandmarkImage(imagesFolderUrl:string){
  let images: string[] = [];
  let imagesThings;
  try {
    let imagesDataSet = await getSolidDataset(imagesFolderUrl, {fetch: fetch}); // get images dataset
    imagesThings = getThingAll(imagesDataSet) // get all the things in the images dataset
    for (let image of imagesThings){
      try{
      const file = await getFile(
        image.url,               // File in Pod to Read
        { fetch: fetch }       // fetch from authenticated session
      );
      if(isRawData(file)){//If it's a file(not dataset)
        images.push(URL.createObjectURL(file));//Creates the file as URL
      }
    }catch(e){

    }
    }
  } catch (error){
    // if the dataset does not exist, return empty array of images
    images = [];
  }
  return images;
}

/**
 * Get the reviews of a landmark
 * @param folder contains the dataset containing the reviews
 * @returns array of reviews
 */
export async function getLandmarkReviews(folder:string) {
    let reviews : Review[] = [];
    try {
      let dataSet = await getSolidDataset(folder, {fetch:fetch}); // get dataset
      // get all things in the dataset of type review
      let things = getThingAll(dataSet).filter((thing) => getUrl(thing, VCARD.Type) === VCARD.hasNote)
      // for each review, create it and add it to the array
      for (let review of things) {
        // get review information
        let title = getStringNoLocale(review, SCHEMA_INRUPT.name) as string;
        let content = getStringNoLocale(review, SCHEMA_INRUPT.description) as string;
        let date = getStringNoLocale(review, SCHEMA_INRUPT.startDate) as string;
        let webId = getStringNoLocale(review, SCHEMA_INRUPT.Person) as string;
        let name = getStringNoLocale(await getUserProfile(webId),FOAF.name) as string;
  
        let newReview : Review = {
          title: title,
          content: content,
          date: date,
          webId: webId,
          username: name
        }
        reviews.push(newReview);
      }
  
    } catch (error) {
      // if there are any errors, retrieve empty array of reviews
      reviews = [];
    }
    return reviews;
  }

/**
 * Get the scores of a landmark
 * @param folder contains the dataset containing the scores
 * @returns Map containing the scores and their creator
 */
export async function getLandmarkScores(folder:string) {
    let dict : Map<string,Array<number>> = new Map<string,Array<number>>();
    try {
      let dataSet = await getSolidDataset(folder, {fetch:fetch}); // get the whole dataset
      // get things of type score
      let things = getThingAll(dataSet).filter((thing) => getUrl(thing, VCARD.Type) === VCARD.hasValue)
      // for each score, create it and add it to the map
      for (let score of things) {
        let value = parseInt(getStringNoLocale(score, SCHEMA_INRUPT.value) as string);
        let landmarkName = getStringNoLocale(score, SCHEMA_INRUPT.name) as string;

        if (dict.has(landmarkName)) {
          dict.get(landmarkName)!.push(value);
        } else {
          let base = new Array<number>();
          base.push(value);
          dict.set(landmarkName, base);
        }
      }
      return dict;
  
    } catch (error) {
      return new Map<string,Array<number>>() // retrieve empty map
    }
  }

// Writing landmarks to POD

/**
 * Add the landmark to the inventory and creates the landmark dataset.
 * @param webID contains the user webID
 * @param landmark contains the landmark to be added
 */
export async function createLandmark(webID:string, landmark:Landmark) {
    let baseURL = webID.split("profile")[0]; // url of the type https://<nombre>.inrupt.net/
    let landmarksFolder = baseURL + "public/lomap/inventory/index.ttl"; // inventory folder path
    let landmarkId;
    // add landmark to inventory
    try {
      landmarkId = await addLandmarkToInventory(landmarksFolder, landmark) // add the landmark to the inventory and get its ID
    } catch (error){
      // if the inventory does not exist, create it and add the landmark
      landmarkId = await createInventory(landmarksFolder, landmark)
    }
    if (landmarkId === undefined) 
      return; // if the landmark could not be added, return (error)
  
    // path for the new landmark dataset
    let individualLandmarkFolder = baseURL + "public/lomap/locations/" + landmarkId + "/index.ttl";
    let imagesFolder = baseURL + "public/lomap/locations/" + landmarkId + "/images";
  
    // create dataset for the landmark
    try {
      await createLandmarkDataSet(imagesFolder, individualLandmarkFolder, landmark, landmarkId)
    } catch (error) {
      console.log(error)
    }
}

/**
 * Adds the given landmark to the landmark inventory
 * @param landmarksFolder contains the inventory folder
 * @param landmark contains the landmark to be added
 * @returns string containing the uuid of the landmark
 */
export async function addLandmarkToInventory(landmarksFolder:string, landmark:Landmark) {
  let inventory = await getSolidDataset(landmarksFolder, {fetch: fetch}) // get the inventory
  let locationId = "LOC_" + uuid(); // create location uuid
  let baseURL = landmarksFolder.split("public")[0]
  let locationURL = `${baseURL}public/lomap/locations/${locationId}/index.ttl#${locationId}` // create location dataset path

  let newLocation = buildThing(createThing({name: locationId}))
    .addStringNoLocale(SCHEMA_INRUPT.identifier, locationURL) // add to the thing the path of the location dataset
    .build();
  
  inventory = setThing(inventory, newLocation); // add thing to inventory
  try {
    await saveSolidDatasetAt(landmarksFolder, inventory, {fetch: fetch}) //save the inventory
    return locationId;
  } catch (error) {
    console.log(error);
  }
}

  /**
 * Creates the landmark inventory and adds the given landmark to it
 * @param landmarksFolder contains the path of the inventory
 * @param landmark contains the landmark object
 * @returns landmark uuid
 */
export async function createInventory(landmarksFolder: string, landmark:Landmark){
    let landmarkId = "LOC_" + uuid(); // landmark uuid
    let landmarkURL = landmarksFolder.split("public")[0] + "public/lomap/locations/" + landmarkId + "/index.ttl#" + landmarkId; // landmark dataset path
  
    let inventory = createSolidDataset() // create dataset for the inventory

    let newLandmark = buildThing(createThing({name: landmarkId})) // create thing with the landmark dataset path
      .addStringNoLocale(SCHEMA_INRUPT.identifier, landmarkURL)
      .build();
    
    inventory = setThing(inventory, newLandmark); // add name to inventory

    try {
      await saveSolidDatasetAt(landmarksFolder, inventory, {fetch: fetch}) // save inventory dataset
      return landmarkId;
    } catch (error) {
      console.log("Error linea 273");
    }
}

/**
 * Create the landmark in the given folder
 * @param landmarkFolder contains the folder to store the landmark .../public/lomap/locations/${landmarkId}/index.ttl
 * @param landmark contains the landmark to be created
 * @param id contains the landmark uuid
 */
export async function createLandmarkDataSet(imagesFolder:string, landmarkFolder:string, landmark:Landmark, id:string) {
    let landmarkIdUrl = `${landmarkFolder}#${id}` // construct the url of the landmark
  
    // create dataset for the landmark
    let dataSet = createSolidDataset();
    // build landmark thing
    let newLandmark = buildThing(createThing({name: id})) 
    .addStringNoLocale(SCHEMA_INRUPT.name, landmark.name.toString())
    .addStringNoLocale(SCHEMA_INRUPT.longitude, landmark.longitude.toString())
    .addStringNoLocale(SCHEMA_INRUPT.latitude, landmark.latitude.toString())
    .addStringNoLocale(SCHEMA_INRUPT.description, landmark.description.toString())
    .addStringNoLocale(SCHEMA_INRUPT.identifier, landmarkIdUrl) // store the url of the landmark
    .addStringNoLocale(SCHEMA_INRUPT.Product, landmark.category) // store string containing the categories
    .addUrl(RDF.type, "https://schema.org/Place")
    .build();
  
  
    dataSet = setThing(dataSet, newLandmark); // store thing in dataset
    // save dataset to later add the images
    dataSet = await saveSolidDatasetAt(landmarkFolder, dataSet, {fetch: fetch}) // save dataset 
    await addLandmarkImage(imagesFolder, landmark); // store the images
  }


  /**
 * Add the landmark images to the given folder
 * @param url contains the folder of the images
 * @param landmark contains the landmark
 */
export async function addLandmarkImage(url: string, landmark:Landmark) {
  landmark.picturesAsFiles?.forEach(async picture => {
  
    const savedFile = await overwriteFile(  
      url+"/"+picture.name,                              
      picture,                                       
      { contentType: picture.type, fetch: fetch }    
    );
})
  }


  /**
 * Add a review to the given landmark
 * @param landmark contains the landmark
 * @param review contains the review to be added to the landmark
 */
export async function addLandmarkReview(landmark:Landmark, review:Review){
  let url = landmark.url + "/index.ttl" as string
  // get dataset
  let landmarkDataset = await getSolidDataset(url, {fetch: fetch})
  // create review
  let newReview = buildThing(createThing())
    .addStringNoLocale(SCHEMA_INRUPT.name, review.title)
    .addStringNoLocale(SCHEMA_INRUPT.description, review.content)
    .addStringNoLocale(SCHEMA_INRUPT.startDate, review.date)
    .addStringNoLocale(SCHEMA_INRUPT.Person, review.webId)
    .addUrl(VCARD.Type, VCARD.hasNote)
    .build();
  // store the review in the location dataset
  landmarkDataset = setThing(landmarkDataset, newReview)

  try {
    // save dataset
    landmarkDataset = await saveSolidDatasetAt(url, landmarkDataset, {fetch: fetch});
  } catch (error){
    console.log(error);
  }
  }
  
  /**
   * Add a rating to the given landmark
   * @param webId contains the webid of the user rating the landmark
   * @param landmark contains the landmark
   * @param score contains the score of the rating
   */
  export async function addLandmarkScore(webId:string, landmark:Landmark, score:number){
    let url = landmark.url + "/index.ttl" as string; // get location dataset path
  // get dataset
  let landmarkDataset = await getSolidDataset(url, {fetch: fetch})
  // create score
  let newScore = buildThing(createThing())
    .addStringNoLocale(SCHEMA_INRUPT.value, score.toString())
    .addStringNoLocale(SCHEMA_INRUPT.Person, webId)
    .addStringNoLocale(SCHEMA_INRUPT.name, landmark.name)
    .addUrl(VCARD.Type, VCARD.hasValue)
    .build();
  // add score to the dataset
  landmarkDataset = setThing(landmarkDataset, newScore)

  try {
    // save dataset
    landmarkDataset = await saveSolidDatasetAt(url, landmarkDataset, {fetch: fetch});
  } catch (error){
    console.log(error);
  }
  }


// Friend management

  export async function getFriendsLandmarks(webID:string){
    let friends = getUrlAll(await getUserProfile(webID), FOAF.knows);
    const landmarkPromises = friends.map(friend => getLandmarksPOD(friend as string));

    return await Promise.all(landmarkPromises);
  }

  export async function getUserProfile(webID: string) : Promise<Thing>{
    // get the url of the full dataset
    let profile = webID.split("#")[0]; //just in case there is extra information in the url
    // get the dataset from the url
    let dataSet = await getSolidDataset(profile, {fetch: fetch});
    // return the dataset as a thing
    return getThing(dataSet, webID) as Thing;
}
