import { Request, Response, NextFunction } from "express";

export function needAuth(req: Request, res:Response, next:NextFunction) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/');
  }
}