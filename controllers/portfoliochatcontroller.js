import StatusCodes from "http-status-codes";
import Project from "../models/Project.js";
import Feature from "../models/feature-Model.js";
import TechStack from "../models/tech_stack.js";
import Teams from "../models/team-model.js";
import Client from "../models/clientModel.js";
import User from "../models/user-model.js";
import ProjectTeam from "../models/projectTeamModel.js";
import getOpenAiConfig from "../utils/openAiConfigHelper.js";

import OpenAI from "openai";
import { BadRequest, InternalServer } from "../middlewares/customError.js";
import {
  PortfolioMessages,
  ProjectFields,
  TeamFields,
  ClientFields,
  SystemMessage,
  UserFields,
  DataSection,
} from "../constants/enums.js";

let openai;
let openaiInitialized = false;

const initializeOpenAI = async () => {
  try {
    const openAiKey = await getOpenAiConfig("openaikey");
    openai = new OpenAI({
      apiKey: openAiKey,
    });
    openaiInitialized = true;
  } catch (error) {
    console.error("Failed to initialize OpenAI:", error);
    openaiInitialized = false;
  }
};

initializeOpenAI().catch((error) => {
  console.error("Error during OpenAI initialization:", error);
});

const fetchAllPortfolioData = async () => {
  const [projects, features, techStacks, teams, clients, users, projectTeams] = await Promise.all([
    Project.find({}).lean(),
    Feature.find({}).lean(),
    TechStack.find({}).lean(),
    Teams.find({}).lean(),
    Client.find({}).lean(),
    User.find({}).lean(),
    ProjectTeam.find({}).lean(),
  ]);
  return { projects, features, techStacks, teams, clients, users, projectTeams };
};

export const fetchPortfolioData = async (req, res, next) => {
  try {
    const data = await fetchAllPortfolioData();
    res.status(StatusCodes.OK).json({
      ...data,
      message: PortfolioMessages.PORTFOLIO_DATA_FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    next(InternalServer(PortfolioMessages.ERROR_FETCHING_PORTFOLIO_DATA));
  }
};

export const processChatMessage = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return next(BadRequest(PortfolioMessages.INVALID_CHAT_MESSAGE_FORMAT));
    }

    if (!openaiInitialized) {
      return next(InternalServer("OpenAI is not initialized."));
    }

    const { projects, features, techStacks, teams, clients, users, projectTeams } =
      await fetchAllPortfolioData();

    const createLookup = (array, key) =>
      array.reduce((acc, item) => {
        acc[item[key]] = item;
        return acc;
      }, {});
    const featuresLookup = createLookup(features, "_id");
    const techStacksLookup = createLookup(techStacks, "_id");
    const teamsLookup = createLookup(teams, "_id");
    const clientsLookup = createLookup(clients, "_id");
    const usersLookup = createLookup(users, "_id");
    const projectTeamsLookup = projectTeams.reduce((acc, pt) => {
      if (!acc[pt.project_id]) acc[pt.project_id] = [];
      acc[pt.project_id].push(pt);
      return acc;
    }, {});

    // Join and format project data
    const joinedProjects = projects.map((project) => ({
      ...project,
      client: clientsLookup[project.client_id],
      team: teamsLookup[project.team_id],
      techStack: (project.techStack || []).map((techId) => techStacksLookup[techId]),
      features: (project.feature || []).map((featureId) => featuresLookup[featureId]),
      projectTeamMembers: (projectTeamsLookup[project._id] || []).map((pt) => ({
        user: usersLookup[pt.user_id],
        role: pt.role_in_project,
        team: teamsLookup[pt.team_id],
      })),
    }));

    // Summarize data for GPT
    const projectsSummary = joinedProjects.slice(0, 5).map((project) => `
      ${ProjectFields.NAME}: ${project.name}
      ${ProjectFields.DESCRIPTION}: ${project.description}
      ${ProjectFields.STATUS}: ${project.status}
      ${ProjectFields.BUDGET}: $${project.budget}
      ${ProjectFields.HOURS_TAKEN}: ${project.hr_taken}
      ${ProjectFields.START_DATE}: ${new Date(project.start_time).toLocaleDateString()}
      ${ProjectFields.END_DATE}: ${new Date(project.end_time).toLocaleDateString()}
      ${ProjectFields.CLIENT}: ${project.client ? project.client.name : PortfolioMessages.NOT_AVAILABLE}
      ${ProjectFields.TECH_STACK}: ${project.techStack.map((tech) => tech.name).join(", ")}
      ${ProjectFields.FEATURES}: ${project.features.map((feature) => feature.name).join(", ")}
      ${ProjectFields.TEAM_MEMBERS}: ${project.projectTeamMembers
        .map(
          (member) =>
            `${member.user?.fname || "Unknown"} ${member.user?.lname || ""} (Role: ${
              member.role
            }, Team: ${member.team?.teamTitle || "Unknown"})`,
        )
        .join(", ")}
    `).join("\n\n");

    const techStacksSummary = techStacks.map((tech) => tech.name).join(", ");
    const featuresSummary = features.map((feature) => feature.name).join(", ");

    const formattedData = `
${DataSection.PROJECTS}:
${projectsSummary}

${DataSection.TECH_STACKS}: ${techStacksSummary}

${DataSection.FEATURES}: ${featuresSummary}
`;

    const systemMessage = {
      role: SystemMessage.ROLE,
      content: SystemMessage.CONTENT.replace("{formattedData}", formattedData),
    };

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [systemMessage, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 500,
    });

    res.status(StatusCodes.OK).json({
      message: completion.choices[0].message.content,
      status: PortfolioMessages.CHAT_MESSAGE_PROCESSED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    next(InternalServer(PortfolioMessages.ERROR_PROCESSING_CHAT_MESSAGE));
  }
};
