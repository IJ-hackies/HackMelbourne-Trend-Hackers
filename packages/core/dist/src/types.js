"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitEventType = void 0;
var GitEventType;
(function (GitEventType) {
    GitEventType["Commit"] = "commit";
    GitEventType["BranchSwitch"] = "branch-switch";
    GitEventType["Push"] = "push";
    GitEventType["ForcePush"] = "force-push";
    GitEventType["Rebase"] = "rebase";
    GitEventType["Merge"] = "merge";
    GitEventType["MergeConflict"] = "merge-conflict";
})(GitEventType || (exports.GitEventType = GitEventType = {}));
