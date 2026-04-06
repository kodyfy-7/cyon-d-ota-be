const errorHandler = require("../../middleware/errorHandler");
const { Op } = require("sequelize");
const PaginationService = require("../../helpers/pagination");
const slugify = require("slugify");

const Event = require("../../models/Event");

const toBaseSlug = (value) => {
  const slug = slugify(value || "event", { lower: true, strict: true, trim: true });
  return slug || "event";
};

const resolveUniqueSlug = async (baseInput, excludeEventId = null) => {
  const base = toBaseSlug(baseInput);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const where = { slug: candidate };
    if (excludeEventId) {
      where.id = { [Op.ne]: excludeEventId };
    }

    const existing = await Event.findOne({ where, attributes: ["id"] });
    if (!existing) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      perPage = 25,
      sort = "createdAt:desc",
      name,
      slug,
      createdBy,
      search,
      startDate,
      endDate
    } = req.query;

    const where = {};

    if (name) where.name = name;
    if (slug) where.slug = slug;
    if (createdBy) where.createdBy = createdBy;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const paginate = PaginationService.pagination({ page, perPage });

    const results = await Event.findAndCountAll({
      where,
      order: PaginationService.sortList({ sort }),
      ...paginate
    });

    const meta = PaginationService.paginationLink({
      total: results.count,
      page,
      perPage
    });

    return res.status(200).send({
      success: true,
      data: { events: results.rows },
      meta
    });
  } catch (error) {
    return res
      .status(500)
      .send(
        await errorHandler(error, "Error fetching events", req.originalUrl)
      );
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      slug,
      fileUrl,
      description
    } = req.body;

    const eventSlug = await resolveUniqueSlug(slug || name);

    const event = await Event.create({
      name,
      slug: eventSlug,
      fileUrl: fileUrl || null,
      description: description || null,
      createdBy: req.user?.id || null,
      updatedBy: req.user?.id || null
    });

    return res.status(201).send({
      success: true,
      message: "Event created",
      data: event
    });
  } catch (error) {
    return res
      .status(500)
      .send(await errorHandler(error, "Error creating event", req.originalUrl));
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, slug, fileUrl, description } = req.body;

    const event = await Event.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (name !== undefined) event.name = name;
    if (slug !== undefined || name !== undefined) {
      event.slug = await resolveUniqueSlug(slug || name || event.name, eventId);
    }
    if (fileUrl !== undefined) event.fileUrl = fileUrl;
    if (description !== undefined) event.description = description;
    event.updatedBy = req.user?.id || event.updatedBy;

    await event.save();

    return res.status(200).send({
      success: true,
      message: "Event updated",
      data: event
    });
  } catch (error) {
    return res
      .status(500)
      .send(await errorHandler(error, "Error updating event", req.originalUrl));
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.status(200).send({
      success: true,
      data: event
    });
  } catch (error) {
    return res
      .status(500)
      .send(await errorHandler(error, "Error fetching event", req.originalUrl));
  }
};

exports.getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({
      where: { slug }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.status(200).send({
      success: true,
      data: event
    });
  } catch (error) {
    return res
      .status(500)
      .send(await errorHandler(error, "Error fetching event", req.originalUrl));
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    await event.destroy();

    return res.status(200).send({
      success: true,
      message: "Event deleted"
    });
  } catch (error) {
    return res
      .status(500)
      .send(await errorHandler(error, "Error deleting event", req.originalUrl));
  }
};

