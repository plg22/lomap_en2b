import {useEffect, useState} from "react";
import 'leaflet/dist/leaflet.css';
import "../../map/stylesheets/home.css";
import "./home.css"
import {useSession} from "@inrupt/solid-ui-react";
import {Landmark} from "../../shared/shareddtypes";
import {MapContainer, Marker, Popup, TileLayer} from "react-leaflet";
import { getLandmarksPOD } from "../../solidHelper/solidLandmarkManagement";
import markerIcon from "leaflet/dist/images/marker-icon.png"
import { Icon } from "leaflet";
import {makeRequest} from "../../axios"; 
import { wait } from "@testing-library/user-event/dist/utils";

function Home(): JSX.Element {
    const {session} = useSession();
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [generatedLandmarks, setGeneratedLandmarks] = useState<JSX.Element[]>([]);

    useEffect( () => { 
        if (session.info.webId !== undefined && session.info.webId !== "") {
            makeRequest.post("/users/",{solidURL: session.info.webId});
        }
        makeRequest.get("/users/" + session.info.webId?.split("//")[1].split(".")[0]).then((res) => {
            console.log( res.data[0]._id );
            console.log( session.info.clientAppId );
            session.info.clientAppId = res.data[0]._id;
        })
        
        doGetLandmarks();
        wait(10000)
    }, [session.info.webId, landmarks]);
    

    async function getLandmarks(){
        let fetchedLandmarks : Landmark[] | undefined = await getLandmarksPOD(session.info.webId);
        if (fetchedLandmarks === undefined) return null;
        console.log(session.info.webId);
        setLandmarks(fetchedLandmarks);
    }

    async function doGetLandmarks() {
        await getLandmarks();
        let array : JSX.Element[] = [];
        landmarks.forEach(landmark => {
            let element =  <Marker position={[landmark.latitude, landmark.longitude]} icon={new Icon({iconUrl: markerIcon})}>
                    <Popup>
                            {landmark.name} - {landmark.category} - {landmark.description} - 
                            <img src ={landmark.pictures === undefined ? "" :landmark.pictures[0] } alt = "No images" width={200} height={200}></img>
                    </Popup>
                </Marker>;
            array.push(element);
            }
        );
        
        setGeneratedLandmarks(array);
    }

    return (
        <div className="homeContainer">
            <h1>Home</h1>
            <h2>Landmarks may take a while to load...</h2>
            <MapContainer center={[50.847, 4.357]} 
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '50%', width: '75%' }}>
                        
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                { generatedLandmarks }
            </MapContainer>
        </div>
    );
}

export default Home;