const express = require("express");
const MemberController = require("../app/controllers/MemberController");
const {
    validate,
    validateCreateMember,
    validateUpdateMember,
    validateMakeAdmin,
    validateUpdateApprovalStatus
} = require("../app/services/Validation/RequestValidation");
const { authenticateUser } = require("../middleware/authenticateUser");
const { authenticateAdmin } = require("../middleware/authenticateAdmin");

const router = express.Router();

router.route("/members/me").get(authenticateUser, MemberController.getMyProfile);

router.route("/members").get(authenticateAdmin, MemberController.getAllMembers);

router.route("/members").post(authenticateAdmin, validateCreateMember(), validate, MemberController.createMember);

router.route("/members/:memberId").get(authenticateAdmin, MemberController.getMemberById);

router.route("/members/:memberId").patch(authenticateAdmin, validateUpdateMember(), validate, MemberController.updateMember);

router.route("/members/:memberId").delete(authenticateAdmin, MemberController.deleteMember);

router
    .route("/members/:memberId/approval")
    .patch(authenticateAdmin, validateUpdateApprovalStatus(), validate, MemberController.updateMemberApprovalStatus);

router.route("/members/:memberId/admin").post(authenticateAdmin, validateMakeAdmin(), validate, MemberController.makeAdministrator);

router.route("/members/:memberId/admin").delete(authenticateAdmin, MemberController.unmakeAdministrator);

module.exports = router;
