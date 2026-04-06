"use strict";

const swaggerUi = require("swagger-ui-express");

const serverUrl = process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}/api/v1`;

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "sacc-be API",
        version: "1.0.0",
        description: "Swagger documentation for the current sacc-be backend API."
    },
    servers: [
        {
            url: serverUrl.endsWith("/api/v1") ? serverUrl : `${serverUrl}/api/v1`,
            description: "API server"
        }
    ],
    tags: [
        { name: "Auth" },
        { name: "Members" },
        { name: "Events" },
        { name: "Uploads" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Something went wrong" }
                }
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    phoneNumber: { type: "string", nullable: true, example: "08012345678" },
                    isActive: { type: "boolean", example: true }
                }
            },
            Member: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    userId: { type: "string", format: "uuid" },
                    gender: { type: "string", example: "female" },
                    outstation: { type: "string", nullable: true, example: "Lagos" },
                    dateOfBirth: { type: "string", format: "date", example: "1995-03-14" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true }
                }
            },
            Administrator: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    positionId: { type: "string", format: "uuid" },
                    isSuper: { type: "boolean", example: false }
                }
            },
            Event: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", example: "Annual Summit 2026" },
                    fileUrl: { type: "string", nullable: true, example: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
                    description: { type: "string", nullable: true, example: "Public annual summit event." },
                    createdBy: { type: "string", format: "uuid", nullable: true },
                    updatedBy: { type: "string", format: "uuid", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true }
                }
            },
            RegisterRequest: {
                type: "object",
                required: ["name", "email", "password", "gender", "dateOfBirth"],
                properties: {
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", format: "email", example: "jane@example.com" },
                    password: { type: "string", example: "StrongPass123" },
                    phoneNumber: { type: "string", example: "08012345678" },
                    gender: { type: "string", example: "female" },
                    outstation: { type: "string", nullable: true, example: "Lagos" },
                    dateOfBirth: { type: "string", format: "date", example: "1995-03-14" }
                }
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "superadmin@sacc.com" },
                    password: { type: "string", example: "Password@123" }
                }
            },
            RefreshTokenRequest: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string", example: "your-refresh-token" }
                }
            },
            EventRequest: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string", example: "Annual Summit 2026" },
                    fileUrl: { type: "string", nullable: true, example: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
                    description: { type: "string", nullable: true, example: "Public annual summit event for members and guests." }
                }
            },
            MemberCreateRequest: {
                allOf: [{ $ref: "#/components/schemas/RegisterRequest" }]
            },
            MemberUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string", example: "Jane Doe Updated" },
                    phoneNumber: { type: "string", example: "08087654321" },
                    gender: { type: "string", example: "female" },
                    outstation: { type: "string", nullable: true, example: "Abuja" },
                    dateOfBirth: { type: "string", format: "date", example: "1995-03-14" },
                    isActive: { type: "boolean", example: true }
                }
            },
            MakeAdminRequest: {
                type: "object",
                required: ["positionId"],
                properties: {
                    positionId: { type: "string", format: "uuid" },
                    isSuper: { type: "boolean", example: false }
                }
            },
            AuthResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful." },
                    data: {
                        type: "object",
                        properties: {
                            accessToken: { type: "string" },
                            refreshToken: { type: "string" },
                            user: { $ref: "#/components/schemas/User" },
                            member: {
                                anyOf: [
                                    {
                                        type: "object",
                                        properties: {
                                            id: { type: "string", format: "uuid" },
                                            gender: { type: "string" },
                                            outstation: { type: "string", nullable: true },
                                            dateOfBirth: { type: "string", format: "date" }
                                        }
                                    },
                                    { type: "null" }
                                ]
                            },
                            administrator: {
                                anyOf: [
                                    { $ref: "#/components/schemas/Administrator" },
                                    { type: "null" }
                                ]
                            }
                        }
                    }
                }
            },
            UploadResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Image uploaded successfully" },
                    data: {
                        type: "object",
                        properties: {
                            fileUrl: { type: "string", example: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
                            publicId: { type: "string", example: "sacc-be/images/sample" },
                            width: { type: "integer", example: 1200 },
                            height: { type: "integer", example: 800 },
                            format: { type: "string", example: "jpg" },
                            bytes: { type: "integer", example: 245678 }
                        }
                    }
                }
            }
        }
    },
    paths: {
        "/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a new member account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Registration successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" }
                            }
                        }
                    },
                    "409": { description: "Email already exists" },
                    "500": { description: "Server error" }
                }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" }
                            }
                        }
                    },
                    "401": { description: "Invalid credentials" },
                    "500": { description: "Server error" }
                }
            }
        },
        "/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary: "Refresh access token",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RefreshTokenRequest" }
                        }
                    }
                },
                responses: {
                    "200": { description: "Access token refreshed" },
                    "401": { description: "Invalid refresh token" }
                }
            }
        },
        "/members/me": {
            get: {
                tags: ["Members"],
                summary: "Get current logged-in member profile",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Profile returned" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Profile not found" }
                }
            }
        },
        "/members": {
            get: {
                tags: ["Members"],
                summary: "List all members",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "query", name: "page", schema: { type: "integer", example: 1 } },
                    { in: "query", name: "perPage", schema: { type: "integer", example: 25 } },
                    { in: "query", name: "sort", schema: { type: "string", example: "createdAt:desc" } },
                    { in: "query", name: "search", schema: { type: "string", example: "jane" } },
                    { in: "query", name: "gender", schema: { type: "string", example: "female" } },
                    { in: "query", name: "isAdmin", schema: { type: "string", example: "true" } }
                ],
                responses: {
                    "200": { description: "Members returned" },
                    "403": { description: "Admin access required" }
                }
            },
            post: {
                tags: ["Members"],
                summary: "Create a member",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/MemberCreateRequest" }
                        }
                    }
                },
                responses: {
                    "201": { description: "Member created" },
                    "409": { description: "Email already exists" }
                }
            }
        },
        "/members/{memberId}": {
            get: {
                tags: ["Members"],
                summary: "Get member by id",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "memberId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    "200": { description: "Member returned" },
                    "404": { description: "Member not found" }
                }
            },
            patch: {
                tags: ["Members"],
                summary: "Update member",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "memberId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/MemberUpdateRequest" }
                        }
                    }
                },
                responses: {
                    "200": { description: "Member updated" },
                    "404": { description: "Member not found" }
                }
            },
            delete: {
                tags: ["Members"],
                summary: "Delete member",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "memberId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    "200": { description: "Member deleted" },
                    "404": { description: "Member not found" }
                }
            }
        },
        "/members/{memberId}/admin": {
            post: {
                tags: ["Members"],
                summary: "Make member an administrator",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "memberId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/MakeAdminRequest" }
                        }
                    }
                },
                responses: {
                    "200": { description: "Member promoted" },
                    "404": { description: "Member or position not found" }
                }
            },
            delete: {
                tags: ["Members"],
                summary: "Remove administrator status",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "memberId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    "200": { description: "Member demoted" },
                    "404": { description: "Member or administrator not found" }
                }
            }
        },
        "/events": {
            get: {
                tags: ["Events"],
                summary: "List public events",
                parameters: [
                    { in: "query", name: "page", schema: { type: "integer", example: 1 } },
                    { in: "query", name: "perPage", schema: { type: "integer", example: 12 } },
                    { in: "query", name: "sort", schema: { type: "string", example: "createdAt:desc" } },
                    { in: "query", name: "name", schema: { type: "string", example: "Annual Summit 2026" } },
                    { in: "query", name: "createdBy", schema: { type: "string", format: "uuid" } },
                    { in: "query", name: "search", schema: { type: "string", example: "summit" } },
                    { in: "query", name: "startDate", schema: { type: "string", format: "date-time" } },
                    { in: "query", name: "endDate", schema: { type: "string", format: "date-time" } }
                ],
                responses: {
                    "200": { description: "Events returned" }
                }
            },
            post: {
                tags: ["Events"],
                summary: "Create event",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/EventRequest" }
                        }
                    }
                },
                responses: {
                    "201": { description: "Event created" },
                    "403": { description: "Admin access required" }
                }
            }
        },
        "/events/{eventId}": {
            get: {
                tags: ["Events"],
                summary: "Get public event by id",
                parameters: [
                    { in: "path", name: "eventId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    "200": { description: "Event returned" },
                    "404": { description: "Event not found" }
                }
            },
            patch: {
                tags: ["Events"],
                summary: "Update event",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "eventId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/EventRequest" }
                        }
                    }
                },
                responses: {
                    "200": { description: "Event updated" },
                    "404": { description: "Event not found" }
                }
            },
            delete: {
                tags: ["Events"],
                summary: "Delete event",
                description: "Admin-only endpoint.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { in: "path", name: "eventId", required: true, schema: { type: "string", format: "uuid" } }
                ],
                responses: {
                    "200": { description: "Event deleted" },
                    "404": { description: "Event not found" }
                }
            }
        },
        "/uploads/image": {
            post: {
                tags: ["Uploads"],
                summary: "Upload image to Cloudinary",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["file"],
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary"
                                    },
                                    folder: {
                                        type: "string",
                                        example: "sacc-be/images"
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Image uploaded",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UploadResponse" }
                            }
                        }
                    },
                    "400": { description: "Invalid file upload" },
                    "401": { description: "Unauthorized" }
                }
            }
        }
    }
};

const swaggerUiOptions = {
    customSiteTitle: "sacc-be Swagger Docs",
    swaggerOptions: {
        persistAuthorization: true
    }
};

module.exports = {
    swaggerSpec,
    swaggerUi,
    swaggerUiOptions
};