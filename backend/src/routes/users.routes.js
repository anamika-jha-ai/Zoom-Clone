import {Router} from "express";
import {login, register, addToHistory, getUserHistory} from "../controllers/users.controllers.js";

const router = Router();

router.route("/login").post( login)
router.route("/register").post(register);
// router.route("/add_to_activity")
// router.route("/get_activities")
// router.route("/get_activity/:id")
// router.route("/delete_activity/:id")

router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)

export {router as default};