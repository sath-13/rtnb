import Project from '../models/Project.js';
import TechStack from '../models/tech_stack.js';
import Teams from '../models/team-model.js';
import Feature from '../models/feature-Model.js';
import Client from '../models/clientModel.js';
import ProjectTeam from '../models/projectTeamModel.js';
import User from '../models/user-model.js';
import { ImportProjectMessages } from '../constants/enums.js';
import { findOrCreate } from '../utils/dbHelper.js';

export const importProjects = async (jsonDataArray) => {
    const results = [];

    for (const data of jsonDataArray) {
        try {
            // Handle TechStack
            const techStackIds = [];
            if (typeof data.techStackName === 'string') {
                const techStackArray = data.techStackName.split(',').map(tech => tech.trim());
                for (const techName of techStackArray) {
                    try {
                        const techId = await findOrCreate(TechStack, { name: techName }, { name: techName });
                        techStackIds.push(techId);
                    } catch (error) {
                        console.error(`Error creating tech stack "${techName}":`, error.message);
                    }
                }
            }

            // Handle Team
            const teamId = await findOrCreate(Teams, { teamTitle: data.teamTitle }, {
                teamTitle: data.teamTitle,
                teamDescriptions: data.teamDescriptions,
                workspaceName: data.workspaceName.toLowerCase(), // Convert to lowercase,
            });

            // Handle Client
            const clientId = await findOrCreate(Client, { name: data.client_name }, {
                name: data.client_name,
                description: data.client_description,
                contact_info: data.client_contact_info,
                point_of_contact: data.client_point_of_contact,
                image: data.client_image
            });

            // Handle Feature
            const featureIds = [];
            if (typeof data.feature === 'string') {
                const featureArray = data.feature.split(',').map(feature => feature.trim());
                for (const featureName of featureArray) {
                    try {
                        const featureId = await findOrCreate(Feature, { name: featureName }, { name: featureName });
                        featureIds.push(featureId);
                    } catch (error) {
                        console.error(`Error processing feature "${featureName}" for project "${data.name}":`, error.message);
                    }
                }
            }

            const membersData = data['Member Email and Role'] ? data['Member Email and Role'].split(',').map((entry) => {
                const [memberEmail, role] = entry.trim().split('-');
                return { email: memberEmail.trim(), role: role.trim() };
            }) : [];

            const projectData = {
                    name: data.name,
                    short_name: data.short_name?.trim(), // ✅ New required field
                    description: data.description,
                    status: data.status,
                    start_time: new Date(data.start_time),
                    end_time: new Date(data.end_time),
                    budget: data.budget,
                    hr_taken: data.hr_taken,
                    client_id: clientId,
                    techStack: techStackIds,
                    links: {
                        links: data.links_url,
                        github: data.github_url
                    },
                    image_link: data.image_link,
                    team_id: teamId,
                    feature: featureIds,
                    color: data.color
            };


            const project = new Project(projectData);
            await project.save();
            const projectId = project._id;

            // Handle Members
            for (const member of membersData) {
                if (!member.email || !member.role) {
                    console.warn(`Skipping member with missing Email or role in project "${data.name}"`);
                    continue;
                }

                try {
                    let user = await User.findOne({ email: member.email });
                    if (!user) throw new Error(ImportProjectMessages.USER_NOT_FOUND);

                    const projectTeam = new ProjectTeam({
                        project_id: projectId,
                        user_id: user._id,
                        role_in_project: member.role,
                        team_id: teamId
                    });
                    await projectTeam.save();
                } catch (error) {
                    console.error(`Error processing member "${member.email}" in project "${data.name}":`, error.message);
                }
            }

            results.push(`${ImportProjectMessages.PROJECT_IMPORTED}: "${data.name}"`);
        } catch (innerError) {
            console.error(`${ImportProjectMessages.ERROR_IMPORTING_PROJECT} "${data.name}":`, innerError);
            results.push(`${ImportProjectMessages.ERROR_IMPORTING_PROJECT} "${data.name}": ${innerError.message}`);
        }
    }

    return results;
};
