import Feedback from "../models/Feedback-model.js";
import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";
import sendEmail from "../utils/sendEmail.js";
import FeedbackRequest from "../models/Feedback-Request-Model.js";
import { FeedbackMessages } from "../constants/enums.js";
import StoreRequestedFeedback from "../models/RequestFeedbackSchema.js"; 
import config from "../config.js";

export const submitDirectFeedback = async (req, res) => {
  try {
    const {
      userId,         // person receiving feedback
      givenBy,        // person giving feedback (always stored, even if anonymous)
      description,
      feedbackType,   // "direct" or "anonymous"
      workspacename,
    } = req.body;

    // ✅ Basic validation
    if (!userId || !givenBy || !description || !feedbackType || !workspacename) {
      return res.status(400).json({ message: FeedbackMessages.ALL_FIELDS_REQ });
    }

    // ✅ Create and save feedback
    const feedback = new Feedback({
      userId,
      givenBy,
      description,
      feedbackType,
      workspacename,
    });
    

    await feedback.save();

    res.status(201).json({
      message: FeedbackMessages.FEEDBACK_SUBMITED_SUCC,
      feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: ERR_SUBMITING_FEEDBACK, error });
  }
};


export const submitRequestedFeedback = async (req, res) => {
  try {
    const {
      revieweeId,
      reviewerId,
      requesterId,
      description,
      feedbackType = "request",
      workspacename,
    } = req.body;

    if (!revieweeId || !reviewerId || !requesterId || !description || !workspacename) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 1. Save feedback
    const feedback = new StoreRequestedFeedback({
      revieweeId,
      reviewerId,
      requesterId,
      description,
      feedbackType,
      workspacename,
    });

    await feedback.save();

    // 2. Remove the corresponding pending request
    const deletedRequest = await FeedbackRequest.findOneAndDelete({
      revieweeId,
      reviewerId,
      requesterId,
      workspacename,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Requested feedback submitted and request cleared.",
      data: feedback,
      removedRequest: deletedRequest,
    });
  } catch (error) {
    console.error("Error submitting requested feedback:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};



export const getUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    const { workspaceName } = req.query;

    let query = { userId };
    if (workspaceName) {
      query.workspacename = workspaceName;
    }

    const feedbackList = await Feedback.find(query);

    const findUserDetails = async (id) => {
      let userDetails = await User.findById(id, "email fname lname userLogo role");
      if (!userDetails) {
        userDetails = await Admin.findById(id, "email fname lname userLogo role");
      }
      return userDetails || null;
    };

    const populatedFeedback = await Promise.all(
      feedbackList.map(async (feedback) => {
        const fromUser = await findUserDetails(feedback.givenBy);
        const toUser = await findUserDetails(feedback.userId);

        const isAnonymous = feedback.feedbackType === "anonymous";

        return {
          ...feedback.toObject(),
          fromUserName: isAnonymous
            ? fromUser
              ? `${fromUser.fname} ${fromUser.lname}`
              : "Anonymous"
            : fromUser
            ? `${fromUser.fname} ${fromUser.lname}`
            : null,
          fromUserLogo: isAnonymous ? null : fromUser?.userLogo || null,
          isAnonymous,
          toUserName: toUser ? `${toUser.fname} ${toUser.lname}` : null,
        };
      })
    );

    res.status(200).json(populatedFeedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Error fetching feedback.", error });
  }
};





export const getLoggedInUserFeedback = async (req, res) => {
  try {
    const { workspaceName } = req.query;
    const userId = req.headers["x-user-id"]; // from frontend (localStorage or headers)

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const feedback = await Feedback.find({
      userId,
      workspacename: workspaceName,
    })
      .populate("givenBy", "fname lname userLogo")
      .populate("userId", "fname lname userLogo");

    // Modify response for anonymous feedbacks
    const formattedFeedback = feedback.map((item) => {
      const itemObj = item.toObject();
      
      if (itemObj.feedbackType?.toLowerCase() === "anonymous") {
        itemObj.givenBy = {
          fname: "Anonymous",
          lname: "",
          userLogo: null,
        };
      }

      return itemObj;
    });

    res.json(formattedFeedback);
  } catch (err) {
    console.error("Error fetching logged-in user feedback:", err);
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
};







export const sendRequestedFeedbacks = async (req, res) => {
  const { reviewerIds, revieweeId, workspacename, requesterId, isSelfFeedback } = req.body;

  try {
    if (!reviewerIds || reviewerIds.length === 0) {
      return res.status(400).json({ message: FeedbackMessages.NO_REVIEWERS_SELECTED });
    }

    let validReviewers = [];

    // Check if the reviewers exist
    for (const id of reviewerIds) {
      const user = await User.findById(id) || await Admin.findById(id);
      if (user) validReviewers.push(user);
    }

    if (validReviewers.length === 0) {
      return res.status(400).json({ message: FeedbackMessages.NO_VALID_USERS });
    }

    const reviewee = await User.findById(revieweeId) || await Admin.findById(revieweeId);
    if (!reviewee) {
      return res.status(404).json({ message: FeedbackMessages.REVIEW_NOT_FOUND });
    }

    // Handle self-feedback case
    if (isSelfFeedback) {
      for (const reviewer of validReviewers) {
        // Self-feedback request for each reviewer
        const selfReviewRequest = {
          reviewerId: reviewer._id,  // Reviewer is the person requested to give feedback
          revieweeId: reviewee._id,  // Reviewee is the person receiving feedback
          requesterId,  // The person who initiated the request
          workspacename,
          status: "pending",  // Set status to pending for all requests
        };

        await FeedbackRequest.create(selfReviewRequest);


        // Send email to each reviewer for self-feedback
        if (reviewer.email) {

           const feedbackUrl = `${config.CLIENT_URL}`;

          await sendEmail({
            email: reviewer.email,
            subject: `Self-feedback Request for ${reviewee.fname} ${reviewee.lname}`,
            html: `
              <p>Hello ${reviewer.fname} ${reviewer.lname} ,</p>
              <p>You have been requested to submit a review for <strong>${reviewee.fname} ${reviewee.lname}</strong> in the workspace: <strong>${workspacename}</strong>.</p>
              <p>I’d really appreciate your feedback on my performance so far—what’s working well and any areas where I can improve. Your insights will help me continue contributing effectively to the team. Looking forward to your thoughts!</p>
            <p>Regards,<br>${reviewee.fname} ${reviewee.lname}</p>
            <a href="${feedbackUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">
              Give Feedback
            </a>
          `,
        });
        }
      }

      return res.status(200).json({ success: true, message: FeedbackMessages.REVIEW_REQUEST_SUCC });
    }

    // Normal feedback request (if not self-feedback)
    const feedbackRequests = validReviewers.map((reviewer) => ({
      reviewerId: reviewer._id,
      revieweeId,
      requesterId,  // The person requesting the feedback
      workspacename,
      status: "pending",  // Set status to pending for all requests
    }));

    await FeedbackRequest.insertMany(feedbackRequests);

    // Send email notifications to reviewers
    for (const user of validReviewers) {
      if (!user.email) continue;
           const feedbackUrl = `${config.CLIENT_URL}`;

      await sendEmail({
        email: user.email,
        subject: `Request to Review ${reviewee.fname} ${reviewee.lname}`,
        html: `
          <p>Hello ${user.fname}!</p>
          <p>Requesting you to share feedback for <strong>${reviewee.fname} ${reviewee.lname}</strong> so that we can evaluate and measure their progress. To assist you, you may consider aspects like productivity (quality of work, adherence to deadlines), communication (teamwork, accountability, leadership skills, office behavior), company culture, self-improvement, skill building, and areas of improvement.</p>
            <a href="${feedbackUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">
              Give Feedback
            </a>
        `,
      });
    }

    return res.status(200).json({ success: true, message: FeedbackMessages.REVIEW_REQUEST_SUCC });

  } catch (error) {
    console.error("Error sending review emails:", error);
    return res.status(500).json({ message: FeedbackMessages.ERR_OCCURED_WHILE_SENDING_EMAILS });
  }
};



export const declineFeedbackRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, declinedBy } = req.body;

    const request = await FeedbackRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Feedback request not found" });
    }

    const requesterId = request.requesterId;
    const requester = await User.findById(requesterId) || await Admin.findById(requesterId);
    const requesterEmail = requester?.email;

    if (!requesterEmail) {
      return res.status(400).json({ message: "Requester does not have a valid email address" });
    }

    await FeedbackRequest.findByIdAndDelete(id);

    await sendEmail({
      email: requesterEmail,
      subject: "Your Feedback Request Was Declined",
      html: `<p>Hi,</p>
             <p>Your feedback request was <strong>declined</strong> by <strong>${declinedBy}</strong> for the following reason:</p>
             <blockquote>${reason}</blockquote>  <br/>
             <p>Regards ${declinedBy} `
    });

    res.status(200).json({ message: "Feedback request declined and email sent to requester." });
  } catch (error) {
    console.error("Decline Feedback Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getPendingFeedbackRequests = async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await FeedbackRequest.find({
      reviewerId: userId,
      status: "pending",
    });

    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Utility function to get user details from both models
        const getUserDetails = async (id) => {
          return (
            (await User.findById(id).select("fname lname email")) ||
            (await Admin.findById(id).select("fname lname email"))
          );
        };

        const reviewee = await getUserDetails(request.revieweeId);
        const requester = await getUserDetails(request.requesterId);
    


        return {
          ...request.toObject(),
          revieweeId: reviewee || { fname: "N/A", lname: "", email: "" },
          requesterId: requester || { fname: "N/A", lname: "", email: "" },
        };
      })
    );

    res.status(200).json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching pending feedback requests:", error);
    res.status(500).json({ message: "Failed to fetch pending feedback requests" });
  }
};


