import { Request, Response, Router, NextFunction } from "express";
import passport from "passport";
import { needAuth } from "../middlewares/checkAuth";

class DefaultController {
  public path = '/';
  public router = Router();

  constructor() {
    this.initialRoutes();
  }

  public initialRoutes() {
    this.router.get("/", this.getLoginPage)
    this.router.post("/login",passport.authenticate("local",{
      successRedirect : '/home', // redirect to the secure profile section
      failureRedirect : '/', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));
    this.router.get("/logout", needAuth, function(req: Request, res: Response, next: NextFunction) {
      req.logOut();
      res.redirect("/")
    })
    this.router.get("/home", needAuth, this.getHome);
  }

  getLoginPage = async(req: Request, res: Response) => {
    res.render("login");
  }

  getHome = async(req: Request, res: Response) => {
    res.render("home", {
      current_user: req.user
    })
  }
}

export default DefaultController;