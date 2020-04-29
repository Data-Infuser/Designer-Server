import { Router, Request, Response, NextFunction } from "express";
import DefaultController from "../controllers/DefaultController";
import * as passport from "passport";
import { needAuth } from "../middlewares/checkAuth";


const router = Router();
router.get("/", DefaultController.getLoginPage)
router.post("/login",passport.authenticate("local",{
  successRedirect : '/home', // redirect to the secure profile section
  failureRedirect : '/', // redirect back to the signup page if there is an error
  failureFlash : true // allow flash messages
}));

router.get("/logout", needAuth, function(req: Request, res: Response, next: NextFunction) {
  req.logOut();
  res.redirect("/")
})

router.get("/home", needAuth, DefaultController.getHome);


export default router;