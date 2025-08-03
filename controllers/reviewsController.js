import { ReviewMessages } from "../constants/enums.js";
import Review from "../models/ReviewsModel.js";
import { StatusCodes } from "http-status-codes";

export const createReview = async (req, res) => {
    try {
        const reviews = new Review(req.body);
        const savedReview = await reviews.save();
        res.status(StatusCodes.CREATED).json(savedReview); 
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: ReviewMessages.ERROR_SAVING_REVIEW,
            error: err
        }); 
    }
};

export const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({});
        res.status(StatusCodes.OK).json(reviews); 
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: ReviewMessages.ERROR_RETRIEVING_REVIEWS,
            error: err
        }); 
    }
};
