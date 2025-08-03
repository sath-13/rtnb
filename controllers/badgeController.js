import { BadgeMessages, CommonMessages } from "../constants/enums.js";
import { assignBadgeService, createBadgeService,
     deleteBadgeById,
     getAllBadgesService, 
     getAllSuperadminBadgesService,
     getAssignedBadges,
     getUserBadgesById
    } from '../service/badgeService.js';

export const createBadge = async (req, res) => {
    try {
        const loggedInUserId = req.user?._id || req.user?.id;
        const badge = await createBadgeService(loggedInUserId, req.body);
        res.status(201).json({ success: true, message: BadgeMessages.BADGE_CREATED_SUCCESSFULLY, badge });
    } catch (error) {
        console.error("Error creating badge:", error);
        res.status(500).json({ success: false, message: error.message || BadgeMessages.ERROR_FETCHING_BADGES });
    }
};

export const getAllBadges = async (req, res) => {
    try {
        const { workspacename } = req.params;
        const badges = await getAllBadgesService(workspacename);
        res.status(200).json({ success: true, badges });
    } catch (error) {
        console.error("Error fetching badges:", error);
        res.status(500).json({ success: false, message: error.message || BadgeMessages.ERROR_FETCHING_BADGES });
    }
};

export const getAllSuperadminBadges = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(401).json({ success: false, message: BadgeMessages.UNAUTHORIZED_NO_USER });
        }

        const badges = await getAllSuperadminBadgesService(userEmail);
        res.status(200).json({ success: true, badges });

    } catch (error) {
        console.error("Error fetching badges:", error);
        res.status(500).json({ success: false, message: BadgeMessages.ERROR_FETCHING_BADGES, error: error.message });
    }
};

export const assignBadge = async (req, res) => {
    try {
        const assignedBadge = await assignBadgeService(req.body);
        res.status(201).json({ success: true, message: BadgeMessages.BADGE_ASSIGNEd_SUCCESSFULLY, assignedBadge });

    } catch (error) {
        console.error("Error assigning badge:", error);
        res.status(500).json({ success: false, message: error.message || BadgeMessages.ERROR_ASSIGNING_BADGE });
    }
};

export const deleteBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteBadgeById(id);

        if (!result) {
            return res.status(404).json({ message: BadgeMessages.BADGE_NOT_FOUND });
        }

        res.status(200).json({ message: BadgeMessages.BADGE_DELETED_SUCCESSFULLY, badge: result });
    } catch (error) {
        console.error(BadgeMessages.INTERNAL_SERVER_ERROR, error);
        res.status(500).json({ message: BadgeMessages.INTERNAL_SERVER_ERROR });
    }
};

export const getUserBadges = async (req, res) => {
    try {
        // const userId = req.user.id ;
        // Allow user ID to come from req.user or query or params
        const userId = req.query.userId || req.params.userId || req.user?.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: BadgeMessages.USER_ID_IS_REQUIRED });
        }
        
        const badges = await getUserBadgesById(userId);

        if (!badges.length) {
            return res.status(404).json({ success: false, message: BadgeMessages.NO_BADGES_FOUND_FOR_USER });
        }

        res.json({ success: true, badges });
    } catch (error) {
        console.error(BadgeMessages.ERROR_FETCHING_USER_BADGES, error);
        res.status(500).json({ success: false, message: BadgeMessages.ERROR_FETCHING_USER_BADGES });
    }
};

export const getAssignedPublicBadges = async (req, res) => {
    try {
        const { workspacename } = req.params;
        const badges = await getAssignedBadges({ visibility: "public", workspacename });

        res.status(200).json(badges.filter(Boolean));
    } catch (error) {
        console.error("Error fetching public badges:", error);
        res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
    }
};

export const getAssignedTeamBadges = async (req, res) => {
    try {
        const { team } = req.params;
        const badges = await getAssignedBadges({ visibility: "in_team", team });

        res.status(200).json(badges.filter(Boolean));
    } catch (error) {
        console.error("Error fetching team badges:", error);
        res.status(500).json({ message: CommonMessages.INTERNAL_SERVER_ERROR });
    }
};
