import 'leaflet/dist/leaflet.css';
import "./profile.css";

import {makeRequest} from "../../axios";
import {useParams} from "react-router";
import {useEffect, useState} from "react";
import {useSession} from "@inrupt/solid-ui-react";

function Profile(): JSX.Element {
  
  const [user, setUser] = useState({name:"",picture:""});
  const [isFriend, setFriend] = useState(false);
  let uuid = useParams().id;
  const {session} = useSession();
  const [webID, setWebID] = useState<string>("");
  const [score, setScore] = useState<Number>(0);
  
  useEffect(() =>{
    
    const fetchUser = async () => {
      if (uuid == null) {
        uuid = "6433c2435e3283d2f3f7207e";  //Only for testing
        return;
      }
      makeRequest.get(`/solid/`+ uuid+"").then((res) => { setUser(res.data);});
      makeRequest.get("/users/id/"+uuid).then((res) => { setWebID(res.data.solidURL); });
      makeRequest.get(`/users/score/`+ uuid+"").then((res) => { setScore(res.data.score);});

      let id;

      if (session.info.webId == null) {
        id = "https://plg22.inrupt.net/profile/card";  //Used for testing
      } else {
        id = session.info.webId?.split("#")[0];
      }

      const url = new URL(id || "");

      const hostParts = url.host.split('.');
      const username = hostParts[0];
      makeRequest.get("/users/"+username).then((res) => {
        makeRequest.get("/solid/"+res.data[0]._id+"/friends").then((res1) => {
          for(let i=0; i<res1.data.length; i++){
            if(res1.data[i].solidURL === webID){
              setFriend(true); break;
            }
          }
      })
   
    });
    
    }
    fetchUser();
  },[user,setUser,uuid,setWebID,isFriend,setFriend]);
  
  return (
    
      <div className="profile">
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover"> 
              <img
                className="profileUserImg"
                src= {user.picture === null ? "/noAvatar.png" : user.picture}
              />
            </div>
            <div className="profileInfo">
              <h4 className="profileInfoName">{user.name}</h4>
            </div>
          </div>
          
          <div className="profileRightBottom">
          {session.info.webId?.split("#")[0] === webID ? "" : isFriend ? "You are already friends": "This user is not your friend" }
          </div>

          <div className="profileScore">
          Your current score is: {score}, keep adding landmarks to see how it grows!!!
          </div>
          
          
        </div>
      </div>
  );
}

export default Profile;