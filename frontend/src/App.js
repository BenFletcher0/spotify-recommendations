import {useState, useEffect, createContext, useContext} from 'react'


import './App.css';

//This context will be used to pass down values to child components
const ContextW = createContext();

function App() {

  const [user, setUser] = useState([false, "no-name", "no-image"]);
  
  
  //if user not logged in, display login page
  if(user[0] === false){

    return (
      
      <ContextW.Provider value = {{user, setUser}}>
      <LoggedOut/>
      </ContextW.Provider>

      
    );

  }

  //display homepage
  else{

    return(
      <ContextW.Provider value = {{user, setUser}}>
      <HomePage/>
      </ContextW.Provider>
    );

  }
}



function LoggedOut(){

    
    const {user, setUser} = useContext(ContextW);
    
    //check if user is logged in or not
    useEffect(() => {

       fetch("/getUserInfo", {

        method: "GET",
        mode: "no-cors",


      })
      .then(response => response.json())
      .then(data => {
       



        if(data.error === true){
          setUser([false, "no-name"])
        }
        if(data.error === false){
          setUser([true, data.meInfo.meInfo.display_name, data.meInfo.meInfo.images.url ])
        }
        
      })
      .catch(err => console.log(err))
     
  
  
    }, [])

    


    return(
    <div className="App">
      <h1 className = "background-green"> Welcome to the site. You are not logged in </h1>
      <a type = "button" href = "http://localhost:8000/login" > Log in</a>
      
    </div>

    );

}

function HomePage(){

  const {user, setUser} = useContext(ContextW);

  
  return(

 

  <div className="Home">
    <h2 className = "bordered"> Logged in as: {user[1]} 
    <a href = "http://localhost:8000/logout" > Logout</a>
    <img className = "pfp" src = {user[3]} alt = {"pfp"} />
    </h2>
   
    
    
    <RecDisplays/>
    <LogWidget/>
    

    
  
  </div>


  
  );



}

//display for reccomendations
function RecDisplays(){

  const [trackFE, setTrackFE] = useState(null);
  const [artistFE, setArtistFE] = useState(null);

  //fetch recomendations
  useEffect(() => {

    fetch("/getRecsUsingStoredInfo", {

      method: "GET",
      mode: "no-cors",


    })
    .then(response => response.json())
    .then(data => {

      
      if(data.track_recs !== null && data.artists_recs !== null){

      setTrackFE(data.track_recs);
      setArtistFE(data.artists_recs);

      }
      
    })
    .catch(err => console.log(err))
   


  }, [])

  return(

    <div className = "RecContainer">
      <CreatePlaylistWithRecsButton/>

      <div>Recomendations by your top 2 artists: </div>

      <div className = "artistRec">
      <ContextW.Provider value = {{artistFE, setArtistFE}}>
      <GenerateArtistRecs/>
      </ContextW.Provider>

      </div>


      <br></br>

      <div>Recomendations by your top 2 albums: </div>
      <div className = "trackRec">
      <ContextW.Provider value = {{trackFE, setTrackFE}}>
      <GenerateTrackRecs/>
      </ContextW.Provider>
      </div>



    

      

      


    </div>




  );


}


//log container 
function LogWidget(){



  return(
  <div className = "logContainer">

  <div>Your History on this website </div>

  <br></br>


  <div className = "logInner">
  
  <GenerateLogs/>

  </div>
  
</div>

);


//fetch logs and loop through them to display
function GenerateLogs(){

  const [dataArr, setDataArr] = useState(null);

  useEffect(() => {

    fetch("/fetchLogs", {

      method: "GET",
      mode: "no-cors",


    })
    .then(response => response.json())
    .then(data => {

      

      console.log(data.returned.length)
  

      setDataArr(data.returned)

      

      

    
      
    })
    .catch(err => console.log(err))
   


  }, [])

  if(dataArr !== null){


  //Here we go through each element of the returned mongo db database entries for the previous playlist creations
  //I used this video to get started on displaying an array of elements in react: https://www.youtube.com/watch?v=ke1pkMV44iU, specifically the map function

  return(

    <div className = "con">

      
      {dataArr.map(log => (

        
        <div className = "ind" key = {log._id}>
          <div>
            Playlist_id: <br></br> {log.Playlist_Generated}
          </div>
          <div>
            Date_created: <br></br>{log.Date}
          </div>
          <div>
            Tracks: <br></br>{log.tracks.map(track=>(
              
              <div key = {track}>
              {track}
              </div>

            ))}
          </div>
          
        
          
        </div>


      ))}
      


    </div>
    
  );

  } 
  else{

    return(

      <div>
        <div>Nothing to fetch</div>
  
  
      </div>
      
    );

  }


}



  
}

//component that generates JSX for reccomendations, which will then be present in RecsDisplay
function GenerateTrackRecs(){

  const {trackFE, setTrackFE} = useContext(ContextW);

  if(trackFE !== null){

  return(

    <div className = "track">

      
      {trackFE.map(track => (

  
      <div className = "indtrack" key = {track.uri}>
        <div>
           <img src ={track.album.images.url} alt = {"song cover"}></img>
        </div>
        <br></br>
        <div>
          Artist: {track.artists[0].name}
          
        </div>
        <div>
          Song name: {track.name}
        </div>

        </div>

        ))}

      </div>
        
      
        
      


    



    


  );

  }
  else{

    return(

      <div> Nothing to display</div>

    );
  }


}

//component that generates JSX for reccomendations, which will then be present in RecsDisplay
function GenerateArtistRecs(){

  const {artistFE, setArtistFE} = useContext(ContextW);

  if(artistFE !== null){

  return(

    <div className = "art">

      
      {artistFE.map(track => (

  
      <div className = "indArt" key = {track.uri}>
        
        <div>
        <img src ={track.album.images.url} alt = {"song cover"}></img>
        </div>
        <br></br>
        <div>
          Artist: {track.artists[0].name}
          
        </div>
        <div>
          Song name: {track.name}
        </div>

        </div>

        ))}

      </div>
        


  );

  }
  else{

    return(

      <div> Nothing to display</div>

    );
  }


}


//button for creating playlist
//all the data needed here will be on server side already
function CreatePlaylistWithRecsButton(){

  const [buttonIndicator, setButtonIndicator] = useState(false);
  const {type, data} = useContext(ContextW);
  
  
  useEffect(() => {

    fetch("/addToPlaylist",{
    
      method: "Get",
      mode: "no-cors",


    }
    ).then(response => {
      
      console.log(response.json())
    })
    .then(data => {
        console.log(data)
      })
    .catch(err => console.log(err));


  }, [buttonIndicator])


  function buttonClicked(){

    
    setButtonIndicator(!buttonIndicator)

  }

  return (

    <button onClick = {buttonClicked}> Add these recs to playlist</button>

  );

  }


  

export default App;
