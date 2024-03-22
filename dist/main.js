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
        // const ms: string = core.getInput('milliseconds')
        // // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
        // console.log(`Waiting ${ms} milliseconds ...`)
        // // Log the current timestamp, wait, then log the new timestamp
        // console.log(new Date().toTimeString())
        // await wait(parseInt(ms, 10))
        // console.log(new Date().toTimeString())
        // // Set outputs for other workflow steps to use
        // core.setOutput('time', new Date().toTimeString())
        // Get the inputs from the workflow file
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
            const res = await octokit.rest.issues.createComment({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                issue_number: issueNumber,
                body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
            });
            // get type of comment body followed by params
            const commentBodyArgs = commentBody.split(' ');
            const command = commentBodyArgs[0];
            const participantAccountNames = commentBodyArgs.slice(1);
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
            const { data } = await octokit.rest.repos.getContent({
                owner: github_1.context.repo.owner,
                repo: github_1.context.repo.repo,
                path: maintainerFilePath
            });
            const owner = github_1.context.repo.owner;
            const repo = github_1.context.repo.repo;
            const path = maintainerFilePath;
            const { data: data2 } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
                owner: owner,
                repo: repo,
                path: path,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            const fileContent = data2.content; // @ts-ignore 
            console.log(fileContent);
            const decodedContent = atob(fileContent.content || "");
            console.log("Parsed content");
            console.log(decodedContent);
            const parsedContent = js_yaml_1.default.load(decodedContent);
            console.log(parsedContent);
            // console.log(`Maintainers: ${JSON.stringify(parsedContent)}`)
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