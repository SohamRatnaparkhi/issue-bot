"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
// type GithubContext = typeof context
async function run() {
    try {
        console.log('staring the action');
        const token = (0, core_1.getInput)('gh-token');
        const octokit = (0, github_1.getOctokit)(token);
        if (octokit == null) {
            throw new Error('Unable to get octokit');
        }
        console.log('octokit is here');
        if (github_1.context.eventName === 'issue_comment') {
            const issueNumber = github_1.context.payload.issue?.number;
            const commenterId = github_1.context.payload['comment']?.['user']?.['login'] ?? '';
            const commentBody = github_1.context.payload['comment']?.['body'] ?? '';
            if (issueNumber == null) {
                throw new Error('Issue number is not defined');
            }
            // const res = await octokit.rest.issues.createComment({
            //   owner: context.repo.owner,
            //   repo: context.repo.repo,
            //   issue_number: issueNumber,
            //   body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
            // })
            // get type of comment body followed by params
            const commentBodyArgs = commentBody.trim().split(' ');
            const command = commentBodyArgs[0];
            const participantAccountNames = commentBodyArgs.slice(1);
            participantAccountNames.forEach((name) => name.trim().substring(1));
            console.log(command);
            console.log(participantAccountNames);
            // check repo status using labels
            const labels = await octokit.rest.issues.listLabelsOnIssue({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: issueNumber
            });
            const labelNames = labels.data.map(label => label.name);
            // check if the issue has the right label
            const issueStatesInLine = (0, core_1.getInput)('issue-states-inline');
            // parse yaml string and convert to object
            const issueStates = js_yaml_1.default.load(issueStatesInLine);
            console.log(`Issue states: ${JSON.stringify(issueStates)}`);
            const exchangeKeyValueInObject = (obj) => {
                const newObj = {};
                for (const key in obj) {
                    newObj[obj[key]] = key;
                }
                return newObj;
            };
            const issueStatesReverse = exchangeKeyValueInObject(issueStates);
            console.log(`Issue states reverse: ${JSON.stringify(issueStatesReverse)}`);
            if (!labelNames.includes(issueStatesReverse['help-wanted'])) {
                console.log(`Issue #${issueNumber} does not have the right label`);
            }
            const roles = (0, core_1.getInput)('roles-config-inline');
            const rolesConfig = js_yaml_1.default.load(roles);
            console.log(`Roles config: ${JSON.stringify(rolesConfig)}`);
            // get user role
            const maintainerFilePath = (0, core_1.getInput)('maintainers-config');
            const owner = github_1.context.repo.owner;
            const repo = github_1.context.repo.repo;
            const path = maintainerFilePath;
            const { data } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
                owner: owner,
                repo: repo,
                path: path,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            const maintainerFileContent = data.content; // @ts-ignore 
            console.log(maintainerFileContent);
            const decodedContent = Buffer.from(maintainerFileContent, "base64").toString("binary");
            console.log("Parsed content");
            console.log(decodedContent);
            const parsedContent = js_yaml_1.default.load(decodedContent);
            console.log(parsedContent);
            const participantToRoles = {};
            for (const key in parsedContent) {
                const val = parsedContent[key];
                for (const vals in val) {
                    participantToRoles[val[vals]] = key;
                }
            }
            console.log(participantAccountNames);
            console.log(participantToRoles);
            console.log(participantAccountNames[0].trim().substring(1));
            const myRole = participantToRoles[participantAccountNames[0].trim().substring(1)];
            // console.log(`Maintainers: ${JSON.stringify(parsedContent)}`)
            console.log(`My role: ${myRole}`);
            let myPermissions = rolesConfig[myRole];
            if (myPermissions == null) {
                myPermissions = rolesConfig['default'];
            }
            console.log(`max issues: ${myPermissions['max-assigned-issues']}`);
            console.log(`max-opened-prs: ${myPermissions[`max-opened-prs`]}`);
            const { data: issueAss } = await octokit.rest.issues.addAssignees({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: issueNumber,
                assignees: [participantAccountNames[0].substring(1)]
            });
            console.log(issueAss);
            // check for role
            // check is user can be assigned
            // assign user
            // update label
        }
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
exports.run = run;
//# sourceMappingURL=main.js.map