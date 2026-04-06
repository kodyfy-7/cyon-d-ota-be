const express = require("express");
const EventController = require("../app/controllers/EventController");
const EventRegistrationController = require("../app/controllers/EventRegistrationController");
const {
  validate,
  validateCreateEvent,
  validateUpdateEvent,
  validateEventRegistration
} = require("../app/services/Validation/RequestValidation");
const { authenticateAdmin } = require("../middleware/authenticateAdmin");

const router = express.Router();

router.route("/events").get(EventController.getAllEvents);

router.route("/events").post(authenticateAdmin, validateCreateEvent(), validate, EventController.createEvent);

router.route("/events/slug/:slug").get(EventController.getEventBySlug);

router.route("/events/:eventId").get(EventController.getEventById);

router.route("/events/:eventId").patch(authenticateAdmin, validateUpdateEvent(), validate, EventController.updateEvent);

router.route("/events/:eventId").delete(authenticateAdmin, EventController.deleteEvent);

router
  .route("/events/:eventId/registrations")
  .post(validateEventRegistration(), validate, EventRegistrationController.createEventRegistration)
  .get(authenticateAdmin, EventRegistrationController.getEventRegistrations);

router
  .route("/events/:eventId/registrations/summary-by-parish")
  .get(authenticateAdmin, EventRegistrationController.getEventRegistrationSummaryByParish);

module.exports = router;
