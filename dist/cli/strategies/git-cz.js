"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _shelljs = _interopRequireDefault(require("shelljs"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _findRoot = _interopRequireDefault(require("find-root"));

var _util = require("../../common/util");

var _parsers = require("../parsers");

var _commitizen = require("../../commitizen");

var gitStrategy = _interopRequireWildcard(require("./git"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// destructure for shorter apis
let parse = _parsers.gitCz.parse;
let getPrompter = _commitizen.adapter.getPrompter,
    resolveAdapterPath = _commitizen.adapter.resolveAdapterPath;
let isClean = _commitizen.staging.isClean;
var _default = gitCz;
exports.default = _default;

function gitCz(rawGitArgs, environment, adapterConfig) {
  // See if any override conditions exist.
  // In these very specific scenarios we may want to use a different
  // commit strategy than git-cz. For example, in the case of --amend
  let parsedCommitizenArgs = _parsers.commitizen.parse(rawGitArgs);

  if (parsedCommitizenArgs.amend) {
    // console.log('override --amend in place');
    gitStrategy.default(rawGitArgs, environment);
    return;
  } // Now, if we've made it past overrides, proceed with the git-cz strategy


  let parsedGitCzArgs = parse(rawGitArgs); // Determine if we need to process this commit as a retry instead of a
  // normal commit.

  let retryLastCommit = rawGitArgs && rawGitArgs[0] === '--retry'; // Determine if we need to process this commit using interactive hook mode
  // for husky prepare-commit-message

  let hookMode = !(typeof parsedCommitizenArgs.hook === 'undefined');
  let resolvedAdapterConfigPath = resolveAdapterPath(adapterConfig.path);
  let resolvedAdapterRootPath = (0, _findRoot.default)(resolvedAdapterConfigPath);
  let prompter = getPrompter(adapterConfig.path);
  isClean(process.cwd(), function (error, stagingIsClean) {
    if (error) {
      throw error;
    }

    if (stagingIsClean && !parsedGitCzArgs.includes('--allow-empty')) {
      throw new Error('No files added to staging! Did you forget to run git add?');
    } // OH GOD IM SORRY FOR THIS SECTION


    let adapterPackageJson = (0, _util.getParsedPackageJsonFromPath)(resolvedAdapterRootPath);
    let cliPackageJson = (0, _util.getParsedPackageJsonFromPath)(environment.cliPath);
    console.log(`cz-cli@${cliPackageJson.version}, ${adapterPackageJson.name}@${adapterPackageJson.version}\n`);
    (0, _commitizen.commit)(_shelljs.default, _inquirer.default, process.cwd(), prompter, {
      args: parsedGitCzArgs,
      disableAppendPaths: true,
      emitData: true,
      quiet: false,
      retryLastCommit,
      hookMode
    }, function (error) {
      if (error) {
        throw error;
      }
    });
  });
}