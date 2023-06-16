import express from "express";

const router = express.Router();
const User = require("../models/User");
  
router.get("/:text", async (req : any, res : any, next : any) => {
    const searchText = req.params.text;
    try {
      const result = await User.find({
        username: searchText
      });
      res.status(200).json(result);
    }
    catch (err){
      res.status(404).json("User not found");
    }
  });

router.get("/id/:id", async (req : any, res : any, next : any) => {
    const id = req.params.id;
    try {
      const result = await User.findById(id);

      res.status(200).json(result);
    }
    catch (err){
      res.status(404).json("User not found");
    }
  });

router.get("/score/:id", async (req : any, res : any, next : any) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);

    if (user && user.score) {
      // Retorna el valor del campo 'score' como respuesta
      res.status(200).json({ score: user.score });
    } else {
      // Si no se encuentra el usuario o no tiene el campo 'score', devuelve un mensaje de error
      res.status(404).json({ error: 'Usuario no encontrado o sin puntaje.' });
    }
  }
  catch (err){
    res.status(404).json("User not found");
  }
});

router.post("/score/:id", async (req : any, res : any, next : any) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);

    // Calcula el nuevo valor del campo 'score' sumando 100
    const newScore = user.score + 100;

    // Actualiza el documento con el nuevo valor del campo 'score'
    await User.updateOne({ _id: id }, { $set: { score: newScore } });

    // Retorna el nuevo valor del campo 'score' como respuesta
    res.json({ score: newScore });
  } catch {
    // Si no se encuentra el usuario o no tiene el campo 'score', devuelve un mensaje de error
    res.status(404).json({ error: 'Usuario no encontrado o sin puntaje.' });
  }
});

router.patch("/", async (req : any, res : any, next : any) => {
    try {
      console.log("PATCH /users/");

      const result = await User.findOne({solidURL: req.body.webId.toString()});

      res.status(200).json(result._id);
    }catch(err){
      res.status(404).json(err);
    }
  });

router.post("/", async (req : any, res : any, next : any) => {
    try {

      if(!req.body.solidURL){
        res.status(400).json("No solidURL provided");
        return;
      }
      let id = req.body.solidURL;
      id = id.split("#")[0]
      const url = new URL(id);
      const hostParts = url.host.split('.');
      const username = hostParts[0];
      
      const user = new User({solidURL: id, username: username, score: 0});
      const result = await user.save();
      console.log("POST /users/");
      res.status(201).json(result);
  
    } catch(err){
      res.status(404).json(err);
    }
  });

module.exports = router;

