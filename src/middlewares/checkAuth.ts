import { Request, Response, NextFunction } from "express";

export function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/');
    }
  }