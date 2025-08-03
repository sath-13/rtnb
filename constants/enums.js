// import { UNAUTHORIZED_ACTION } from "../locale";
export const CommonMessages = {
	BAD_REQUEST_ERROR: 'Bad request error',
	INTERNAL_SERVER_ERROR: 'Internal server error',
	FORBIDDEN_ERROR: 'Forbidden',
	UNAUTHORIZED_ERROR: 'Unauthorized',
	NOT_FOUND_ERROR: 'Not found',
    SERVER_ERROR : "Server Error",
    REVIEW_NOT_FOUND:"Reviewee not found",
  };

  export const eventMessages = {
    SERVER_ERR_FETCH:"Server error fetching events",
    INVALID_ID:"Invalid IDs provided",
    EVENT_NOT_FOUND:"Event not found",
    SESSION_NOT_FOUND:"Session not found in event",
    SERVER_ERR_TOGGLE:"Server error toggling attendance",
    EVENT_CREATE:"Event created",
    USER_ID_MISSING:"User ID missing in request",
    FAILED_TO_FETCH_ATTENDED_EVENTS:"Failed to fetch attended events",
    ATTENDANCE_UPDATED_SUCCESSFULY:"Attendance updated successfully",
    SERVER_ERROR_WHILE_UPDATING_ATTENDANCE:"Server error while updating attendance",
    ERROR_DATE_SESSION_REQUIRED:"Date and sessions are required",
    FAILED_TO_CREATE_EVENT:"Failed to create event",
    ERROR_FETCHING_EVENTS:"Error fetching assigned events",
    INTERNAL_SERVER_ERROR:"Internal Server Error",
    INVALID_PAYLOAD:"Invalid payload",
    ERROR_IN_MARKATTENDANCE:"Error in markAttendance",
    EVENT_NOT_FOUND:"Event not found",
    ERROR_CANCELLING_EVENTS:"Error cancelling event",


  };

  export const todoMessages = {
    MISSING_DATA: "Missing or Invalid Data",
    TASK_SAVED: "Tasks saved successfully",
    FAILED_TO_SAVE_TASK:"Failed to save tasks",
    INTERNAL_SERVER_ERRORS:"Internal Server Error",
  }


  export const BadgeMessages = {
    UNAUTHORIZED_NO_USER : "Unauthorized: No user found",
    MISSING_REQUIREDd_FIELDS : "Missing required fields",
    NO_WORKSPACE_FOUND : "No workspaces found for this user",
    SELECTED_WORKSPACE_REQUIRED_FOR_SPECIFIC_SCOPE: "Selected workspace not found",
    INVALID_WORKSPACE_SCOPE : "Invalid workspace scope",
    USER_EMAIL_NOT_FOUND : "User email not found" ,
    BADGE_CREATED_SUCCESSFULLY : "Badge created successfully",
    WORKSPACENAME_IS_REQUIRED : "Workspace name is required",
    ERROR_FETCHING_BADGES : "Error fetching badges",
    BADGE_NOT_FOUND : "Badge not found",
    INVALID_VISIBLITY_OPTION : "Invalid visibility option",
    BADGE_ASSIGNEd_SUCCESSFULLY : "Badge assigned successfully",
    ERROR_ASSIGNING_BADGE : "Error assigning badge",
    BADGE_DELETED_SUCCESSFULLY : "Badge deleted successfully",
    USER_ID_IS_REQUIRED : "User ID is required",
    NO_BADGES_FOUND_FOR_USER : "No badges found for this user",
    ERROR_FETCHING_USER_BADGES : "Error fetching user badges",
    ERROR_PROCESSING_BADGE : "Error processing badge",
    ERROR_FETCHING_PUBLIC_BADGES : " Error fetching public badges:",
    INTERNAL_SERVER_ERROR :  "Internal Server Error",
    USER_TEAM_NOT_FOUND : "User's team not found",
    ERROR_FETCHING_TEAM_BADGES : "Error fetching team badges",
    USER_ID_IS_REQUIRED:"User Id Required!",
 }

  export const FeedbackMessages = {
    FEEDBACK_SUBMITED_SUCC:"  Feedback submitted successfully",
    ALL_FIELDS_REQ:"All required fields must be provided",
    ERR_SUBMITING_FEEDBACK:"Error submitting feedback",
    NO_REVIEWERS_SELECTED:"No reviewers selected.",
    NO_VALID_USERS:"No valid users found.",
    REVIEW_REQUEST_SUCC:"Review request emails sent and stored successfully.",
    ERR_OCCURED_WHILE_SENDING_EMAILS:"An error occurred while sending review request emails.",
    ERR_FETCHING_PEDING_REQUESTS:"Error fetching pending feedback requests",
    };
  
    // Success and error message definitions
export const ImportProductMessages = {
  SUCCESS: "Products have been successfully imported.",
  ERROR_EMPTY_FILE: "The uploaded file is empty.",
  ERROR_INVALID_FORMAT: "The uploaded file has an invalid format.",
  ERROR_MISSING_FIELDS: "Some required fields are missing in the uploaded data.",
  ERROR_DUPLICATE_PRODUCTS: "Some products already exist in the system.",
  ERROR_UNKNOWN: "An unknown error occurred during import. Please try again.",
};

  export const  ImportProjectMessages = {
    IMPORT_COMPLETED : "Import completed successfully",
    ERROR_DURING_IMPORT : "Error occurred during import",
    NO_FILE_UPLOADED : "No file uploaded",
    INVALID_FILE_TYPE : "Only Excel files are allowed",
    USER_NOT_FOUND : "User not found. Import process stopped.",
    PROJECT_IMPORTED : "Project imported successfully",
    ERROR_IMPORTING_PROJECT : "Error occurred while importing project",
    }
    
  export const ClientMessages = {
    CLIENT_IMAGE_UPLOAD_SUCCESSFULLY: "Client image uploaded successfully",
    ERROR_UPLOADING_CLIENT_IMAGE: "Error uploading client image",
    CLIENT_IMAGE_DELETED_SUCCESSFULLY: "Client image deleted successfully",
    ERROR_DELETING_CLIENT_IMAGE: "Error deleting client image",
    CLIENTS_FETCHED_SUCCESSFULLY: 'Clients fetched successfully',
    CLIENT_FETCHED_SUCCESSFULLY: 'Client fetched successfully',
    CLIENT_CREATED_SUCCESSFULLY: 'Client created successfully',
    CLIENT_UPDATED_SUCCESSFULLY: 'Client updated successfully',
    CLIENT_DELETED_SUCCESSFULLY: 'Client deleted successfully',
    CLIENT_NOT_FOUND: 'Client not found',
    CLIENT_ID_EMPTY: 'Client ID is empty',
    ERROR_FETCHING_CLIENTS: 'Error fetching clients',
    ERROR_FETCHING_CLIENT: 'Error fetching client',
    ERROR_CREATING_CLIENT: 'Error creating client',
    ERROR_UPDATING_CLIENT: 'Error updating client',
    ERROR_DELETING_CLIENT: 'Error deleting client',
    ERROR_DELETING_CLIENT_IMAGE: 'Error uploading image of client',
    ERROR_UPLOADING_CLIENT_IMAGE: 'Error uploading the client image',
    CLIENT_IMAGE_UPLOAD_SUCCESSFULLY: 'Client image uploaded successfully',
    CLIENT_IMAGE_DELETED_SUCCESSFULLY: 'clientimage deleted successfully',
    PROJECT_IMAGE_UPLOAD_SUCCESS: "Project image uploaded successfully",
    PROJECT_IMAGE_DELETE_SUCCESS: "Project image deleted successfully",
    PROJECT_NOT_FOUND: "Project not found",
    ERROR_UPLOADING_IMAGE: "Error uploading project image",
    ERROR_DELETING_IMAGE: "Error deleting project image",
    ERROR_UPLOADING_TO_S3: "Error uploading to S3",
    NO_IMAGE_PROVIDED: "No image provided",
    NO_IMAGE_UPLOADED:"No image file uploaded",
};

export const FeatureMessages = {
      FEATURES_FETCHED_SUCCESSFULLY : "Features fetched successfully",
      FEATURE_FETCHED_SUCCESSFULLY : "Feature fetched successfully",	
      FEATURE_CREATED_SUCCESSFULLY : "Feature created successfully",
      FEATURE_UPDATED_SUCCESSFULLY : "Feature updated successfully",
      FEATURE_DELETED_SUCCESSFULLY : "Feature deleted successfully",
      FEATURE_NOT_FOUND : "Feature not found",
      ERROR_FETCHING_FEATURES : "Error occurred while fetching features",
      ERROR_FETCHING_FEATURE : "Error occurred while fetching feature",
      ERROR_CREATING_FEATURE : "Error occurred while creating feature",
      ERROR_UPDATING_FEATURE : "Error occurred while updating feature",
      ERROR_DELETING_FEATURE : "Error occurred while deleting feature",
      ERROR_ADDING_FEATURE: "Error occurred while adding feature",
      ERROR_REMOVING_FEATURE:"Error occurred while removing feature",
      INVALID_REQUEST_PARAMETERS : 'Parameters not proper',
      PROJECT_NOT_FOUND : "Project not found",
      FEATURE_ALREADY_EXISTS:"Feature already exists in project",
      FEATURE_ADDED_SUCCESSFULLY:"Feature added successfully",
      FEATURE_REMOVED_SUCCESSFULLY:"Feature removed successfully"
}

export const ProjectTeamMessages = {
        TEAM_MEMBERS_FETCHED_SUCCESSFULLY: "Team members fetched successfully",
        PROJECTS_FETCHED_SUCCESSFULLY: "Projects fetched successfully",
        PROJECT_TEAMS_FETCHED_SUCCESSFULLY: "Project teams fetched successfully",
        PROJECT_TEAMS_MEMBER_ADDED_SUCCESSFULLY: "Project teams added successfully",
        PROJECT_TEAMS_UPDATED_SUCCESSFULLY:"Project teams updated successfully",
        PROJECT_TEAMS_NOT_FOUND: "Project teams not found",
        ERROR_FETCHING_TEAM_MEMBERS: "Error occurred while fetching team members",
        ERROR_FETCHING_PROJECTS: "Error occurred while fetching projects",
        ERROR_ADDING_TEAM_MEMBER: "Error occured while adding projects",
        ERROR_UPDATING_PROJECT_TEAM:"Error occured while updating projects",
        ERROR_FETCHING_PROJECT_TEAMS: "Error occurred while fetching project teams",
        USER_ROLES_NOT_FOUND: 'No roles found for this user.',
        USER_ROLES_FETCHED_SUCCESSFULLY: 'User roles fetched successfully.',
        ERROR_FETCHING_USER_ROLES: 'An error occurred while fetching user roles.',
        UNKNOWN_PROJECT: 'Unknown Project',
        NO_TEAM: 'No Team',
        INVALID_REQUEST_PARAMETERS: 'Project ID and User ID are required',
        TEAM_MEMBER_NOT_FOUND: 'Team member not found',
        TEAM_MEMBER_REMOVED_SUCCESSFULLY: 'Team member removed successfully',
        ERROR_REMOVING_TEAM_MEMBER: 'Error occurred while removing team member'
}

export const DataSection = {
          PROJECTS: "Projects",
          TEAMS: "Teams",
          CLIENTS: "Clients",
          TECH_STACKS: "Tech Stacks",
          FEATURES: "Features",
          USERS: "Users",
}

export const PortfolioMessages = {
            PORTFOLIO_DATA_FETCHED_SUCCESSFULLY: "Portfolio data fetched successfully",
            ERROR_FETCHING_PORTFOLIO_DATA: "Error occurred while fetching portfolio data",
            INVALID_CHAT_MESSAGE_FORMAT: "Invalid chat message format",
            CHAT_MESSAGE_PROCESSED_SUCCESSFULLY: "Chat message processed successfully",
            ERROR_PROCESSING_CHAT_MESSAGE: "Error occurred while processing chat message",
            ERROR_PROCESSING_CHAT_AI: "OpenAI is not initialized.",
            UNKNOWN_PROJECT: "Unknown Project",
            UNKNOWN_TEAM: "Unknown",
            NO_TEAM: "None",
            NOT_AVAILABLE: "N/A",
            NO_PROJECT_ROLES: "None",
}

export const ProjectFields = {
              NAME: "Project",
              DESCRIPTION: "Description",
              STATUS: "Status",
              BUDGET: "Budget",
              HOURS_TAKEN: "Hours Taken",
              START_DATE: "Start Date",
              END_DATE: "End Date",
              CLIENT: "Client",
              TEAM: "Team",
              TECH_STACK: "Tech Stack",
              FEATURES: "Features",
              TEAM_MEMBERS: "Team Members",
              LINKS: "Links",
}

export const TeamFields = {
	NAME: "Team",
	DESCRIPTION: "Description",
	MEMBERS: "Members",
}
  
export const SystemMessage = {
    ROLE: "system",
    CONTENT: `You are an AI assistant for SJ Innovations portfolio. Your role is to provide detailed and accurate information about projects, features, tech stacks, teams, clients, and team members. Use the following guidelines:
    
    1. Be concise yet comprehensive in your responses.
    2. When asked about a specific project, provide all relevant details including its description, status, budget, timeline, client, team, tech stack, features, and team members with their roles.
    3. If asked about a tech stack or feature, mention all projects that use it.
    4. For team-related queries, provide information about the team members, their roles, and the projects they've worked on.
    5. When discussing clients, include information about their projects and point of contact.
    6. If asked about project timelines or budgets, provide specific details from the project data.
    7. Be prepared to compare projects based on various criteria like tech stack, features, or team size.
    8. If asked about specific team members, provide their details including name, email, role, status, their primary team, other teams they belong to, and the projects they're involved in with their respective roles.
    9. Always provide context for your answers, explaining how the information relates to the overall portfolio.
    10. If you're unsure about any information, state that it's not available in the current data rather than making assumptions.
    11. When discussing team affiliations, always mention the primary team first, followed by any additional teams a member might be part of.
    
    Here's the current data from our database:
    {formattedData}
    
    Use this information to answer user queries accurately and comprehensively.`,
}

export const TechStackMessages = {
      INVALID_REQUEST_PARAMETERS: 'Project ID and Tech Stack ID are required',
      PROJECT_NOT_FOUND: 'Project not found',
      TECH_STACK_NOT_FOUND: 'Tech Stack not found in project',
      TECH_STACK_ALREADY_EXISTS: 'Tech Stack already added to project',
      TECH_STACK_ADDED_SUCCESSFULLY: 'Tech Stack added to project successfully',
      TECH_STACK_REMOVED_SUCCESSFULLY: 'Tech Stack removed from project successfully',
      ERROR_ADDING_TECH_STACK: 'Error occurred while adding tech stack',
      ERROR_REMOVING_TECH_STACK: 'Error occurred while removing tech stack',
      ERROR_GETTING_TECH_STACK_BY_ID : "Error getting tech stack by ID",
      ERROR_CREATING_STACK : "Error creating stack",
      ERROR_GETTING_TECH_STACK : "Error getting tech stack" ,
};

export const ProjectMessages = {
    PROJECTS_FETCHED_SUCCESSFULLY : "Projects fetched successfully",
    PROJECT_FETCHED_SUCCESSFULLY : "Project fetched successfully",
    PROJECT_CREATED_SUCCESSFULLY : "Project created successfully",
    PROJECT_UPDATED_SUCCESSFULLY : "Project updated successfully",
    PROJECT_DELETED_SUCCESSFULLY : "Project deleted successfully",
    PROJECT_NOT_FOUND : "Project not found",
    NO_PROJECTS_FOUND : "No projects found",
    ERROR_FETCHING_PROJECTS : "Error occurred while fetching projects",
    ERROR_FETCHING_PROJECT : "Error occurred while fetching project",
    ERROR_CREATING_PROJECT : "Error occurred while creating project",
    ERROR_UPDATING_PROJECT : "Error occurred while updating project",
    ERROR_DELETING_PROJECT : "Error occurred while deleting project",
    SERVER_ERROR : "Server error occurred",
    PROJECT_IMAGE_UPLOAD_SUCCESSFULLY: "Project image uploaded successfully",
    PROJECT_IMAGE_DELETED_SUCCESSFULLY: "Project image deleted successfully",
    ERROR_UPLOADING_PROJECT_IMAGE: "Error uploading project image",
    ERROR_DELETING_PROJECT_IMAGE: "Error deleting project image",
}
    

export const ClientFields = {
	NAME: "Client",
	DESCRIPTION: "Description",
	CONTACT: "Contact",
	POINT_OF_CONTACT: "Point of Contact",
}
  
export const UserFields = {
	NAME: "Name",
	EMAIL: "Email",
	ROLE: "Role",
	STATUS: "Status",
	PRIMARY_TEAM: "Primary Team",
	OTHER_TEAMS: "Other Teams",
	PROJECT_ROLES: "Project Roles",
}

export const TeamMessages = {
    TITLE_REQUIRED: 'Team Title is required',
    TITLE_ALREADY_EXISTS: 'This title already exists',
    TEAM_CREATED_SUCCESSFULLY: 'Team created successfully',
    TEAM_UPDATED_SUCCESSFULLY: 'Team updated successfully',
    TEAM_DELETED_SUCCESSFULLY: 'Team deleted successfully',
    TEAMS_FETCHED_SUCCESSFULLY: 'Teams fetched successfully',
    TEAM_NOT_FOUND: 'Team not found',
    TEAMS_CREATION_FAILED: 'Failed to create team',
    NEW_FIELD_ADDED: 'New field added successfully',
    TEAM_ALREADY_ASSIGNED: 'Team already assigned to selected users.',
    ERROR_CREATING_TEAM : "Error creating team",
    ERROR_FETCHING_TEAM: "Error fetching teams",
    ERROR_UPDATING_TEAM: "Error updating team",
    ERROR_DELETING_TEAM : "Error deleting team",


};


export const ActionMessages = {
      WORKSPACE_NAME : "Workspace name is required",
      ACTION_CREATED : "Action created successfully and email sent",
      ACTION_CREATE_ERR: "Error creating action:",
      SERVER_ERR:"Internal Server Error",
      NOT_FOUND : "Action not found",
      SUCCESS_REMOVED: "User removed from action successfully" ,
      REMOVE_ERROR : "Error removing user from action",
      ACTION_NOT_FOUND : "Action not found",
      NEW_ASSIGNED_USER:"New assigned user not found",
      NEW_ASSIGNED_USER_WARN:"New assigned user does not have an email.",
      STATUS_UPDATED : "Status updated successfully",
      TEAM_TITLE_UPDATED : "User Assigned to different team successfully",
      DESCRIPTION_UPDATE :  "Description updated successfully" ,
      ERROR_UPDATE_STATUS : "Error updating status",
      ERROR_UPDATE_DESCRIPTION : "Error updating description:",
      INVALID_USER_FORMAT : "Invalid user ID format",
      ERROR_GETTING_ACTION : "Error getting actions:" ,
      USER_ID_REQUIRED : "User ID is required",
      ERROR_ADDING_ACTION : "Error adding user to action",
      ERROR_FETCHING_DETAILS : "Error fetching action details",
      ASSIGNER_USER_UPDATE_SUCC:"Assigned user updated successfully!",
      UPDATE_ERR:" Error updating assigned user:",
      FILES_UPLOADED:"Files uploaded successfully!",
     
}

export const AuthMessages = {
       PASSWORD_NOT_MATCH : "Passwords do not match",
       USER_ALREADY_EXIST : "User already exists" ,
       USER_REGISTERED_SUCCESSFULLY : "User registered successfully",
       INVALID_EMAIL_PASSWORD : "Invalid email or password" ,
       ACCOUNT_INACTIVE : "Your account is inactive. Please contact support to activate",
       LOGIN_SUCCESSFUL : "Login successful",
       LOGIN_ERROR: "Login Error",
       USER_DONT_BELONG : "User does not belong to this workspace",
       USERNAME_TAKEN : "Username is already taken",
       USERNAME_AVAILABE : "Username is available",
       ERROR_CHECK_USERNAME : "Error checking username",
       INVALID_TOKEN : "Invalid or expired token",
       PASSWORD_RESET_SUCCESS : "Password reset successful",
       ERROR_RESET_PASSWORD : "Error resetting password",
       ERROR_VERIFYING_TOKEN : "Error verifying token",
       ERROR_CHECKING_USER : "Error checking users",
       NO_USER_FOUND : "No user found with that email address",
       RESENT_EMAIL_SENT : "Password reset email sent",
       ERROR_SENDING_EMAIL : "Error sending reset email",
       ERROR_FORGOT_PASSWORD : "Error in forgot password",
       EMAIL_NOT_REGISTRED_ERR:"Unauthorized! Your email is not registered.",
       SERVER_ERR:"Internal Server Error",
       PASSWORD_RESET_EMAIL_SENT:"Password reset email sent!",
       FAILED_TO_SEND_EMAIL:"Failed to send email.",
}


export const CommentMessages = {
     ERROR_CREATING_COMMENT : "Error creating comment",
     ERROR_FETCHING_COMMENTS:  "Error fetching comments",
     ERROR_DELETING_COMMENT: "Error deleting comment",
} 


export const HistoryMessages = {
       ERROR_FETCHING_HISTORY : "Error fetching history",
       FAILED_TO_FETCH : "Failed to fetch history",
       INVALID_HISTORY_DATA : "Invalid history data",
       HISTORY_LOGGED_SUCCESSFULLY : "History logged successfully",
       ERROR_LOGGING_HISTORY : "Error logging history",
       FAILED_TO_LOG_HISTORY : "Failed to log history"
}


export const NotificationMessages = {
       USERID_REQUIRED : "UserId is required",
       ERROR_FETCHING_NOTIFICATION : "Error fetching notifications",
       NOTIFICATION_NOT_FOUND : "Notification not found",
       NOTIFICATION_MARK_READ : "Notification marked as read",
       ERROR_MARKING_NOTIFICATION : "Error marking notification as read",
       NOTIFICATION_NOT_FOUND : "Notification not found",
       NOTIFICATION_DELETED : "Notification deleted",
       ERROR_DELETING_NOTIFICATION : "Error deleting notification",
       MARK_ALL_NOTIFICATION_READ : "All notifications marked as read",

}

export const ReviewMessages = {
      ERROR_SAVING_REVIEW : "Error saving review",
      ERROR_RETRIEVING_REVIEWS :  "Error retrieving reviews",
      STREAM_CREATED_SUCCESSFULLY : "Stream created successfully",
      STREAM_UPDATED_SUCCESSFULLY:"Stream updated successfully",
      ERROR_CREATING_STREAM :   "Error creating stream",
      ERROR_FETCHING_STREAMS : "Error fetching streams",
      STREAM_NOT_FOUND : "Stream not found",
      STREAM_DELETED_SUCCESSFULLY :  "Stream deleted successfully",
      ERROR_DELETING_STREAM : "Error deleting stream",
      ERROR_UPDATING_STREAM : "Error updating stream",
}

export const streamMessages = {
    PERSONAL_STREAM_EXISTS:"Personal_Stream already exists",
    STREAM_CREATED:"Stream created successfully",
    STREM_CREATE_ERR:"Error creating stream",
    STREAM_ALREADY_EXISTS:"Stream already exists!",
}


export const SubstreamMessages = {
     RECIEVED_REQUEST_BODY : "Received request body",
     STREAM_NAME_REQUIRED : "Stream Name is required",
     SUB_STREAM_CREATD_EMAIL_SENT : "Sub Stream created and reset email sent",
     ERROR_CREATING_SUBSTREAM : "Error creating sub stream",
     ERROR_FETCHING_STREAMS : "Error fetching sub-streams",
     STREAM_NOT_FOUND : "Sub-stream not found",
     STREAM_DELETED_SUCCESSFULLY : "Sub Stream deleted successfully",
     ERROR_DELETING_STREAM : "Error deleting sub-stream",
     SUB_STREAM_UPDATED_SUCC:"Sub-stream updated successfully",
     SUB_STREAM_UPDATE_ERR:"Error updating sub-stream",
     STREAM_TITLE_REQ:"Stream title is required",
}


export const UserMessages = {
     INVALID_FILE_TYPE : "Invalid file type. Only PNG and JPEG are allowed." ,
     USER_NOT_FOUND : "User not found ",
     USER_UPDATED_SUCCESSFULLY : "User updated successfully",
     ERROR_UPDATING_USER : "Error updating user",
     USER_ALREADY_EXIST : "User with this email or username already exists",
     TEAM_IS_REQUIRED : "Team is required" ,
     USER_CREATED_RESET_SENT : "User created and reset email sent!",
     ERROR_CREATING_USER : "Error creating user",
     USERNAME_ALREADY_TAKEN : "Username is already taken",
     USERNAME_IS_AVAILABLE : "Username is available",
     ERROR_CHECKING_USERNAME : "Error checking username",
     EMAIL_ALREADY_TAKEN : "Email is already taken",
     EMAIL_AVAILABLE : "Email is available",
     ERROR_CHECKING_EMAIL : "Error checking email",
     ERROR_FETCHING_USERS : "Error fetching users",
     USER_DELETED_SUCCESSFULLY : "User deleted successfully" ,
     FAILED_TO_DELETE_USER : "Failed to delete user",
     STATUS_UPDATED : "User status updated successfully",
     INVALID_USERID_ARRAY : "Invalid userIds array" ,
     ERROR_FETCHING_USERNAME : "Error fetching usernames",
     ERROR_FETCHING_USER_ID : "Error fetching user by ID",
     NO_FILE_UPLOADED:"No file uploaded",
     WORKSPACE_NAME_REQ:"Workspace name is required",
     WORKSPACE_NOT_FOUND:"Workspace not found",
     EMPTY_FILE_UPLOADED:"Empty file uploaded",
     IMPORT_USER_ERR:"Error importing users",
     NO_INACTIVE_USER:"No inactive users found.",
     RESEND_EMAILS_ERR:"Error resending emails",
     TARGET_WORKSPACE_NOT_FOUND:"Target workspace not found",
     USER_TRANSFER_SUCC:"Users transferred successfully",
     USER_REPLICA_SUCC:"Users replicated successfully!",
     INTERNAL_SERV_ERR:"Internal server error",
     WORKSPACENAME_REQ:"Workspace name is required",
     EMAIL_AND_WORKSPACENAME_REQ:"Email and workspace name are required",
     USER_FETCHED_SUCC:"Users fetched successfully",
     PROVIDE_VALID_EMAIL:"Please provide a valid email",
}


export const WorkspaceMessages = {
     UNAUTHORIZED_ADMIN : "Unauthorized: Admin not found",
     MIN_LENGTH : "Minimum length should be 4 characters!",
     WORKSPACE_CREATED_SUCCESSFULLY : "Workspace created successfully" ,
     ERROR_CREATING_WORKSPACE : "Error creating workspace",
     INVALID_FILE_TYPE : "Invalid file type. Only PNG and JPEG are allowed.",
     WORKSPACE_NOT_FOUND : "Workspace does  not exist",
     WORKSPACE_LOGO_UPDATED_SUCCESSFULLY : "Workspace logo updated successfully in all models",
     ERROR_UPDATING_WORKSPACE_LOGO : "Error updating workspace logo",
     WORKSPACE_EXISTS : "Workspace exists" ,
     ERROR_CHECKING_WORKSPACE_EXISTENCE: 
     "Error checking workspace existence:",
     UNAUTHORIZED_ACCESS : "Unauthorized access",
     ERROR_FETCHING_WORKSPACE: 'Error fetching workspaces',
     UNAUTHORIZED_CANNOT_DELETE : "Unauthorized: You cannot delete this workspace",
     WORKSPACE_DATA_DELETED : "Workspace and all related data deleted successfully",
     ERROR_DELETING_WORKSPACE :  "Error deleting workspace" ,
     WORKSPACE_NAME_REQUIRED : "Workspace name is required" ,
     WORKSPACE_UPDATED_IN_ALL : "Workspace updated successfully in all models" , 
     WORKSPACENAME_EXISTS:"Workspace name already exists. Choose a different name.",
     WORKSPACENAME_REQ:"Workspace name is required.",
     INTERNAL_SERVER_ERROR:"Internal Server Error",
     NO_FILE_UPLOADED:"No file uploaded",
     UNAUTHORIZED_MSG:"Unauthorized",
     USER_NOT_FOUND:"User not found",
}



export const NotifyuserMessages = {
    ACTION_NOT_FOUND : "ACTION_NOT_FOUND",
    NO_TEAM_ASSOCIATES : "There are no teams associated with this stream, so no notifications have been sent..",
    USER_NOTIFIED_SUCCESSFULLY : "Users notified successfully",
}



export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
  };

  export const modifiedByModel_ROLES = {
    ADMIN: 'Admin',
    USER: 'User',
  };

  export const createdByModel_ROLES = {
    ADMIN: 'Admin',
    USER: 'User',
  };

  export const resourceCoordinatorModel_ROLES = {
    ADMIN: 'Admin',
    USER: 'User',
  };

  export const employeeModel_ROLES = {
    ADMIN: 'Admin',
    USER: 'User',
  };
  
  export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };
  
  export const BRANCHES = {
    GOA: 'Goa',
    DHAKA: 'Dhaka',
    SYLHET: 'Sylhet',
  };
  

  export const ACTION_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };
  
  export const ACTION_PRIORITY = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    TRIVIAL: 'Trivial',
  };
  
  
  export const PRODUCT_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
  };
  
  export const ASSIGNED_BY_MODEL = {
    USER: "User",
    ADMIN: "Admin",
  };

  export const ProductMessages = {
    PROVIDE_ID:"Please provide id",
    NOT_AUTHORIZED:"Not authorized to proceed with this task",
    USER_NOT_ACTIVE:"User is not active",
    NO_PRODUCT_EXISTS:"No product exists",
    PRODUCT_ALREADY_IN_USE:"Product already in use",
    ASSIGNED_PRODUCT_CREATED:"Assigned product created",
    FETCHING_PRODUCTS_ERR:"Error fetching assigned products",
    NO_DEVICES_ASSIGNED:"No devices assigned",
    ASSIGNED_PRODUCT_UPDATED:"Assigned product updated",
    ALL_ASSIGNED_PRODUCTS_DELETED:"All assigned products deleted",
    SERVER_ERR:"Server Error",
    PRODUCT_DELETED_SUCC:"Product deleted successfully",
    ALL_PRODUCTS_DELETED:"All products deleted",
  };

  export const ResourceAllocationMessages = {
    BOOKING_NOT_FOUND:"Booking not found!",
    BOOKING_CREATE_SUCC:"Bookings successfully created",
    BOOKING_DEL:"Booking deleted",
    MISSING_REQ_PARAMS:"Missing required parameters.",
    BOOKING_TIME_OVERLAPS:"Booking time overlaps with an existing booking.",
    NO_OVERLAP:"No Overlap",
  };

  export const TokenMessages = {
    EXPIRED_TOKEN:"Invalid or expired token",
    TOKEN_VERIFICATION_ERR:"Error verifying token",
  };

  export const CompanyMessages = {
    COMPANY_DETAILS_SAVED_SUCC:"Company details saved successfully",
    BRANCH_FETCH_ERR:"Error fetching branches",
    NO_COMPANY_DETAILS_FOUND:"No company details found",
  };

  export const FeedMessages = {
    INVALID_ID:"Invalid user or admin ID",
    POST_CREATE_SUCC:"Post created successfully",
    POST_CREATE_FAIL:"Failed to create post",
    WORKSPACE_POSTS_FETCH_ERR:"Error fetching workspace posts:",
    WORKSPACE_POSTS_FETCH_FAIL:"Failed to fetch workspace posts",
    TEAM_POSTS_FETCH_ERR:"Error fetching team posts:",
    TEAM_POSTS_FETCH_FAIL:"Failed to fetch team posts",
  };

 





