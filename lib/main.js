"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const path_1 = __importDefault(require("path"));
const signale_1 = __importDefault(require("signale"));
const config_1 = require("./utils/config");
const issue_1 = require("./utils/issue");
const label_1 = require("./utils/label");
const misc_1 = require("./utils/misc");
const issue_2 = require("./utils/issue");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const version = misc_1.getBuildVersion(path_1.default.resolve(__dirname, '..', 'build.json'));
            if ('string' === typeof version) {
                signale_1.default.info('Version: %s', version);
            }
            signale_1.default.info('Event: %s', github_1.context.eventName);
            signale_1.default.info('Action: %s', github_1.context.payload.action);
            if (!misc_1.isTargetEvent(github_1.context)) {
                signale_1.default.info('This is not target event.');
                return;
            }
            const octokit = new github_1.GitHub(core_1.getInput('GITHUB_TOKEN', { required: true }));
            const config = yield config_1.getConfig(misc_1.getConfigFilename(), octokit, github_1.context);
            if (!Object.keys(config).length) {
                signale_1.default.warn('There is no valid config file.');
                signale_1.default.warn('Please create config file: %s', misc_1.getConfigFilename());
                return;
            }
            const info = yield issue_1.getRelatedInfo(github_1.context.payload, octokit);
            if ('boolean' === typeof info) {
                signale_1.default.warn('There card is not related with issue.');
                return;
            }
            const { projectId, issueNumber } = info;
            const project = yield misc_1.getProjectName(projectId, octokit);
            const column = yield misc_1.getColumnName(github_1.context.payload.project_card.column_id, octokit);
            signale_1.default.info('Target project name: %s', project);
            signale_1.default.info('Target column name: %s', column);
            const currentLabels = yield issue_2.getLabels(issueNumber, octokit, github_1.context);
            const labelsToRemove = label_1.getRemoveLabels(currentLabels, project, column, config);
            const labelsToAdd = label_1.getAddLabels(currentLabels, project, column, config);
            if (labelsToRemove.length) {
                yield issue_2.removeLabels(issueNumber, labelsToRemove, octokit, github_1.context);
            }
            if (labelsToAdd.length) {
                yield issue_2.addLabels(issueNumber, labelsToAdd, octokit, github_1.context);
            }
            signale_1.default.success('Removed: %d', labelsToRemove.length);
            signale_1.default.success('Added: %d', labelsToAdd.length);
        }
        catch (error) {
            core_1.setFailed(error.message);
        }
    });
}
run();