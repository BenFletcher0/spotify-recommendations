

const express = require("express")
var SpotifyWebApi = require('spotify-web-api-node');

const { MongoClient } = require("mongodb")



const app = express()

const configK = require("./configs/keyConfigurations.json")

console.log(configK)

//mongoDB cluster link
const mongoLink = configK.mongoLinkConfig

const client = new MongoClient(mongoLink)

const database = client.db(configK.databaseName)

const collectionLogs = database.collection(configK.tableName)










const queryString = require("querystring")


const client_id = configK.spotifyID
const client_secret = configK.spotifySecret

var access_token = null

var meInfo = null
var topTracks = null
var topArtists = null

var artistRecs = null
var genreRecs = null
var trackRecs = null


//permissions that are associated with the auth code
const scope = "user-read-private user-read-email user-top-read playlist-modify-public"

const state = configK.secureState
//where spotify auth will redirect after prompting the user to auth
const redirect_uri = "http://localhost:8000/login/callback"

var loggedIn = false

//use spotify node api and make a spotify object with all my details
var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

spotifyApi.setAccessToken(null)


app.get('/', (req, res) => {


 res.json({"main_page_of_api": true}) 



})





app.get('/login', (req, res) => {


      //from spotify documentation example
      //link: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
      //redirects to auth endpoint which THEN links to my callback route '/login/callback'
      res.redirect('https://accounts.spotify.com/authorize?' +
      queryString.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog: true //makes user auth everytime 
      }));


      
  

  
})


app.get('/logout', (req, res) => {
    access_token = null
    spotifyApi.setAccessToken("none")

    meInfo = null
    topTracks = null
    topArtists = null

    artistRecs = null
    genreRecs = null
    trackRecs = null

    res.redirect("http://localhost:3000")
})


//callback route for recieving the authorization token from spotify auth endpoint
app.get('/login/callback', async(req, res) => {


  console.log(req.query)
  var code = req.query.code|| null
  var state = req.query.state || null

  //console.log(code)
  //console.log(state)

  //using auth code, get access token(which can then be used to get actual information)
  await spotifyApi.authorizationCodeGrant(code)
  .then(function(data){

    if(data.statusCode === 200){

      
      
      access_token = data.body['access_token']
      spotifyApi.setAccessToken(data.body['access_token'])

      //redirect back to frontend(access token will just be kept in backend)
      res.redirect("http://localhost:3000")

      
    }
    
    
  },

  function(err){

    console.log("something wrong")
    
    //redirect back to frontend
    res.redirect("http://localhost:3000")

  })
   
  
})


   app.get('/getUserInfo', async(req,res) => {

    
    //if user is not signed in /authed by this app
    if(access_token === null){

        res.json({"error:": true})

    }
    else{

        //get user info(email, name, pfp, etc)
       
        await spotifyApi.getMe()
        .then(function(data){ 
            
            
            meInfo = {"meInfo": data.body}
            
           
        },
        function(err){
            console.log("me info", err)
            
        })

        //get user's top 2 artists and the info about those artists
        await spotifyApi.getMyTopArtists({limit:2, time_range: "short_term"})
        .then(function(data){ 
            
            

        topArtists = data.body.items
        
        
        
           
        },
        function(err){
            console.log("topArtists", err)
            
        })

        await spotifyApi.getMyTopTracks({limit:2, time_range: "short_term"})
        .then(function(data){ 

        
        topTracks = data.body.items
        
        
           
        },
        function(err){
            console.log("topArtists", err)
            
        })
        
        res.json({"error": false, 
        "meInfo": meInfo,
        "top_artists": topArtists, 
        "top_tracks": topTracks
    })


    }

    


   })



   
   app.get('/getRecsUsingStoredInfo', async(req,res) => {

    

    if(access_token === null || meInfo ===null || topArtists === null || topTracks === null){

        res.json({"error:": true})

    }
    else{
        //get reccomendations based on previous info that is already generated
       
        let artist_seeds = [topArtists[0].id, topArtists[1].id]
        
       
        let track_seeds = [topTracks[0].id,topTracks[1].id]
       

        //recs based on artist
        await spotifyApi.getRecommendations({limit:2, seed_artists: artist_seeds})
        .then(function(data){ 
            
            
            artistRecs = data.body.tracks
            
            
           
        },
        function(err){
            console.log("artistRecs", err)
            
        })

        //recs based on top albums
        await spotifyApi.getRecommendations({limit:2, seed_tracks: track_seeds })
        .then(function(data){ 
            
            

        trackRecs =  data.body.tracks
        
        
        
           
        },
        function(err){
            console.log("track_recs", err)
            
        })


        
        
           
        
        

        res.json({
            "artists_recs": artistRecs,
            "track_recs": trackRecs
            

        })


    }

    


   })

 
   app.get('/addToPlaylist', (req, res) => {

    var playlist_id = null;
    

    if(trackRecs !== null && artistRecs!== null){

        console.log(trackRecs)
        console.log(artistRecs)

        tracksTotal = []
        tracksTotal.push(trackRecs[0].uri) 
        tracksTotal.push(trackRecs[1].uri)
        tracksTotal.push(artistRecs[0].uri)
        tracksTotal.push(artistRecs[1].uri)

        console.log(tracksTotal)

        let date = Date()
       

        //create playlist new playlist in current users library
        spotifyApi.createPlaylist('Playlist with Recs created on ' + date,{'description': 'this was created using the api','public': true})
        .then(function(data){


            //then, using the id generated from before, add the recommended tracks to the playlist
            spotifyApi.addTracksToPlaylist(data.body.id, tracksTotal)
            .then(function(data){
    
    
                

                //insert a document into mongo database that has links of tracks, date, and id of playlist
                let inserted = {
                    "Playlist_Generated": data.body.snapshot_id,
                    "Date": date,
                    "tracks": tracksTotal,
                    "access_token_stored": access_token
            
                }

                 collectionLogs.insertOne(inserted)
    
            },
            function(err){
    
                console.log(err)
            }
            )



        },
        function(err){

            console.log(err)
        }
        )





    }

    res.json({"balling": "baller"})
   
   
   })
   



   //should load everytime we refresh the page
   //shows all playlists that are created from the logged in user
   app.get('/fetchLogs', async (req, res) => {

    if(access_token !== null){

        //find all logs that match the current user

        //log how how many documents in database
        console.log("documents counted: ",  await collectionLogs.countDocuments())
        //find all documents
        let found = await collectionLogs.find()
        //turn found documents into array
        found = await found.toArray()

        
        res.json({"returned": found})

    }
    else{

        res.json({
            "returned": false
        })

    }



})





//display server msg
app.listen(8000, () => {console.log("Server Up")})