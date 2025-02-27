import markerIcon from "leaflet/dist/images/marker-icon.png"
import 'leaflet/dist/leaflet.css';
import "./addLandmark.css";
import React, {useRef, useState} from "react";
import {
    Button, Container, FormControl,
    Grid, Input, InputLabel,
    MenuItem, Select, Typography
} from "@mui/material";
import L from "leaflet";
import {Landmark, LandmarkCategories} from "../../shared/shareddtypes";
import {makeRequest} from "../../axios";
import {useSession} from "@inrupt/solid-ui-react";
import {MapContainer, TileLayer, useMapEvents} from "react-leaflet";
import {createLandmark} from "../../solidHelper/solidLandmarkManagement";

export default function AddLandmark() {

    const [coords, setCoords] = useState<number[]>([0,0]);
    const [option, setOption] = useState<string>("Other");
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [isButtonEnabled, setIsButtonEnabled] = useState<boolean>(false);
    const [isLandmarkAdded, setIsLandmarkAdded] = useState<boolean>(false);
    const {session} = useSession();

    let picture : string = "";
    let pictureAsFile : File;
    let thereIsPhoto : boolean = false;

    const setPicture = (e : string) => {
        picture = e;
    }
    const setPictureAsFile = (e : File) => {
        pictureAsFile = e;
    }

    const setCoordinates = async (latitude : number, longitude : number) => {
        (map.current as L.Map).panTo([latitude, longitude]);
        if (marker !== null) {
            (map.current as L.Map).removeLayer(marker);
        }
        (document.getElementById("latitude") as HTMLParagraphElement).textContent = latitude.toFixed(3);
        (document.getElementById("longitude") as HTMLParagraphElement).textContent = longitude.toFixed(3);
        await setMarker(new L.Marker([latitude, longitude]).setIcon(L.icon({iconUrl: markerIcon})).addTo(map.current as L.Map));
        await setCoords([latitude, longitude]);      
    }

    async function readFileAsync(file : any, reader : any) : Promise<string> {
        return new Promise((resolve, reject) => {
            reader.onload = () => {
                resolve(reader.result);
            }
            reader.readAsDataURL(file);
        })
    }

    const submit = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Collect everything
        let name : string | undefined = (document.getElementById("name") as HTMLInputElement).value;
        if (name.trim() === "") {
            return;
        }
        let category : string = option;
        let latitude : number = coords[0];
        let longitude : number = coords[1];
        
        let description : string | undefined = (document.getElementById("description") as HTMLInputElement).value;

        let pictures : Array<string> = [];
        let files : Array<File> = [];
        if(thereIsPhoto === true) {
            pictures.push(picture);
            files.push(pictureAsFile);
        }


        let landmark : Landmark = {
            name : name,
            category : category,
            latitude : latitude,
            longitude : longitude,
            description : description,
            pictures : pictures,
            picturesAsFiles : files
        }

        // Access to SOLID
        let webID = session.info.webId;
        if (webID !== undefined) {
            await createLandmark(webID, landmark);
            const id = webID.split("#")[0];
            const url = new URL(id || "");
            const hostParts = url.host.split('.');
            const username = hostParts[0];
            makeRequest.get("/users/"+username).then((res) => {
                makeRequest.post("/users/score/" + res.data[0]._id).then((res) => {
                    console.log(res.data.score);
                    setIsLandmarkAdded(true);
                    (document.getElementById("addedText") as HTMLInputElement).innerHTML = "Landmark has been added";
                    (document.getElementById("images") as HTMLInputElement).disabled = true;
                    (document.getElementById("name") as HTMLInputElement).disabled = true;
                    (document.getElementById("description") as HTMLInputElement).disabled = true;
                })
            })
        }     
    };

    const map = useRef<L.Map>(null);
    let selectItems : JSX.Element[] = Object.keys(LandmarkCategories).map(key => {
        return <MenuItem data-testid = "option-test" value = {key} key = {key} onClick={() => setOption(key)}>{key}</MenuItem>;
    });

    const MapEvents = () => {
        useMapEvents(
            {
                click(e) {
                    setCoordinates(e.latlng.lat, e.latlng.lng);
                }
            }
        );
        return null;
    }

    return <div className="mainDiv"><Grid style={{ height: '90vh', width: '100%' }} container>
            <Grid item xs = {12}>
            <Typography variant="h1" component="h1" textAlign={"center"} style={{color:"#FFF", fontSize: 46}} >Add a landmark</Typography>
            </Grid>
            <Grid item xs = {4} className = "leftPane">
                <form method = "post" className ="addLandmarkForm" onSubmit={submit} data-testid = "form-test">
                    <Grid container spacing={3} rowGap={8}>
                        <FormControl fullWidth data-testid = "zeroField-testid">
                            <div id="addedText"> </div>
                        </FormControl>
                        <FormControl fullWidth data-testid = "firstField-testid">
                            <InputLabel style={{color:"#FFF"}}>Name of the landmark</InputLabel>
                            <Input id = "name" name = "name" style={{color:"#FFF"}}></Input>
                        </FormControl>
                        <FormControl fullWidth data-testid = "secondField-testid">
                            <InputLabel htmlFor="category" style={{color:"#FFF"}}>Category of the landmark</InputLabel>
                            <Select id = "category" name = "category" defaultValue={"Other"} style={{color:"#FFF"}}>
                                {selectItems}
                            </Select>
                        </FormControl>
                        <Grid container rowGap = {1} data-testid="thirdField-testid">
                        <Typography style={{color:"#FFF"}}>Para marcar, haz click en el mapa</Typography>
                            <FormControl fullWidth>
                                <Typography style={{color:"#FFF"}}>Latitude:  </Typography>
                                <Typography id = "latitude" style={{color:"#FFF"}}/>
                            </FormControl>
                            <FormControl fullWidth>
                                <Typography style={{color:"#FFF"}}>Longitude:  </Typography>
                                <Typography id = "longitude" style={{color:"#FFF"}}/>
                            </FormControl>  
                            <FormControl fullWidth data-testid = "firstField-testid">
                                <InputLabel style={{color:"#FFF"}}>Description</InputLabel>
                                <Input onChange={function() {
                                    if ((document.getElementById("description") as HTMLInputElement).value === "") {
                                        setIsButtonEnabled(false);
                                    } else {
                                        setIsButtonEnabled(true)
                                    }
                                }} id = "description" name = "description" style={{color:"#FFF"}}></Input>
                            </FormControl>
                            <FormControl>
                                <Typography style={{color:"#FFF"}}>Add an image</Typography>
                                <input type="file" id="images" accept=".jpg" onChange={async function (e) {
                                    const target = e.target as HTMLInputElement;
                                    if (target.files == null){
                                        return;
                                    }
                                    const file = target.files[0];
                                  
                                    if (!file) {
                                      return;
                                    }
                                  
                                    const reader = new FileReader();

                                    let res = await readFileAsync(file, reader); // wait for the result
                                    thereIsPhoto = true;
                                    setPicture(res);
                                    setPictureAsFile(file);
                                    
                                }}/>
                            </FormControl>     
                        </Grid>
                                {isButtonEnabled && !isLandmarkAdded
                                ? <Grid item justifyContent="flex-end">
                                <Button type = "submit" variant = "contained" data-testid="Save button">
                                    Save new landmark
                                </Button>
                            </Grid> : <Grid item justifyContent="flex-end">
                                <Button type = "submit" variant = "contained" data-testid="Save button" disabled>
                                    Save new landmark
                                </Button>
                                </Grid>
                        }
                    </Grid>
                </form>
            </Grid>
            <Grid item xs = {8} className = "rightPane">
                <MapContainer center={[50.847, 4.357]} 
                zoom={13} 
                scrollWheelZoom={true} 
                ref={map}
                style={{ height: '95%', width: '95%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents />
            </MapContainer>
            </Grid>
        </Grid></div>
}
