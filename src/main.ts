import * as core from '@actions/core';
import { getInput } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import jsYaml from 'js-yaml';
import { assignIssue, commentOnRepo } from './helpers/role';
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */

// type GithubContext = typeof context

export async function run(): Promise<void> {
  try {
    console.log('staring the action')
    const token = getInput('gh-token')

    const octokit = getOctokit(token)
    if (octokit == null) {
      throw new Error('Unable to get octokit')
    }
    console.log('octokit is here')

    if (context.eventName === 'issue_comment') {
      const issueNumber: number | undefined = context.payload.issue?.number
      const commenterId: string = context.payload['comment']?.['user']?.['login'] ?? ''
      const commentBody: string = context.payload['comment']?.['body'] ?? ''

      if (issueNumber == null) {
        throw new Error('Issue number is not defined')
      }

      // const res = await octokit.rest.issues.createComment({
      //   owner: context.repo.owner,
      //   repo: context.repo.repo,
      //   issue_number: issueNumber,
      //   body: `Hello @${commenterId}, you said: ${commentBody} on issue #${issueNumber}!`
      // })

      // get type of comment body followed by params
      const commentBodyArgs = commentBody.trim().split(' ')
      const command = commentBodyArgs[0].trim().substring(1) as Commands
      const participantAccountNames = commentBodyArgs.slice(1);

      participantAccountNames.forEach((name: string) => name.trim().substring(1))

      console.log(command);
      console.log(participantAccountNames)

      // check repo status using labels

      const impDetails: FilteredContext = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        issueNumber: issueNumber
      }

      const labels = await octokit.rest.issues.listLabelsOnIssue({
        owner: impDetails.owner,
        repo: impDetails.repo,
        issue_number: impDetails.issueNumber
      })

      const labelNames = labels.data.map(label => label.name)

      // check if the issue has the right label
      const issueStatesInLine = getInput('issue-states-inline')
      // parse yaml string and convert to object
      const issueStates = jsYaml.load(issueStatesInLine) as Record<string, string>;

      console.log(`Issue states: ${JSON.stringify(issueStates)}`)

      const exchangeKeyValueInObject = (obj: Record<string, string>) => {
        const newObj: Record<string, string> = {}
        for (const key in obj) {
          newObj[obj[key]] = key
        }
        return newObj
      }

      const issueStatesReverse = exchangeKeyValueInObject(issueStates)
      console.log(`Issue states reverse: ${JSON.stringify(issueStatesReverse)}`)
      if (!labelNames.includes(issueStatesReverse['help-wanted'])) {
        console.log(`Issue #${issueNumber} does not have the right label`)
      }

      const roles = getInput('roles-config-inline');
      const rolesConfig = jsYaml.load(roles) as Record<string, RoleOptions>;
      console.log(`Roles config: ${JSON.stringify(rolesConfig)}`);

      // get user role
      const maintainerFilePath = getInput('maintainers-config');

      const owner = context.repo.owner;
      const repo = context.repo.repo;
      const path = maintainerFilePath;
      const { data } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
        owner: owner,
        repo: repo,
        path: path,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      const maintainerFileContent = data.content // @ts-ignore 
      console.log(maintainerFileContent)
      const decodedContent = Buffer.from(maintainerFileContent, "base64").toString("binary")
      console.log("Parsed content")
      console.log(decodedContent)
      const parsedContent = jsYaml.load(decodedContent) as Record<string, string[]>
      console.log(parsedContent)

      const participantToRoles: {[key: string]: string} = {};
      for (const key in parsedContent) {
        const val = parsedContent[key]
        for (const vals in val) {
          participantToRoles[val[vals]] = key;
        }
      }

      console.log(participantAccountNames)
      console.log(participantToRoles)
      console.log(participantAccountNames[0].trim().substring(1))
      const myRole = participantToRoles[participantAccountNames[0].trim().substring(1)];
      // console.log(`Maintainers: ${JSON.stringify(parsedContent)}`)
      console.log(`My role: ${myRole}`)
      let myPermissions = rolesConfig[myRole];

      if (myPermissions == null) {
        myPermissions = rolesConfig['default']
      }

      console.log(`max issues: ${myPermissions['max-assigned-issues']}`)
      console.log(`max-opened-prs: ${myPermissions[`max-opened-prs`]}`)


      participantAccountNames.forEach(async (username) => {
        try {
          const res = await assignIssue(myPermissions, command, username.substring(1), impDetails, octokit);
          if (res)
            commentOnRepo(owner, repo, issueNumber, octokit, `Issue assigned to ${username}`)
        } catch (error) {
          console.log(error)
          core.debug(error as string)
          return;
        }
      });
      // update label

    }

    if (context.eventName === 'pull_request') {
      console.log('pr event');
      console.log(context)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
export type Commands = 'assign' | 'unassign';

export type RoleOptions = {
  "max-assigned-issues": number,
  "max-opened-prs": number,
  "unassign-others": boolean,
  "allowed-labels"?: string[],
}

export type FilteredContext = {
  owner: string,
  repo: string,
  issueNumber: number
}