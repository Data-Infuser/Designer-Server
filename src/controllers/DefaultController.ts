import { Request, Response } from "express";

class DefaultController {
    static getLoginPage = async(req: Request, res: Response) => {
        res.render("login");
    }

    static getHome = async(req: Request, res: Response) => {
        res.render("home", {
            currentUser: req["user"]
        })
    }
}

export default DefaultController;