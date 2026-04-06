"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const SUPER_ADMIN_EMAIL = "superadmin@sacc.com";
const SUPER_ADMIN_POSITION = "Super Admin";

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            const now = new Date();
            const passwordHash = await bcrypt.hash("Password@123", 10);

            const [existingUserRows] = await queryInterface.sequelize.query(
                `SELECT id FROM users WHERE email = :email LIMIT 1`,
                {
                    replacements: { email: SUPER_ADMIN_EMAIL },
                    transaction
                }
            );

            const [existingPositionRows] = await queryInterface.sequelize.query(
                `SELECT id FROM positions WHERE name = :name LIMIT 1`,
                {
                    replacements: { name: SUPER_ADMIN_POSITION },
                    transaction
                }
            );

            const userId = existingUserRows[0]?.id || uuidv4();
            const positionId = existingPositionRows[0]?.id || uuidv4();

            if (!existingPositionRows[0]) {
                await queryInterface.bulkInsert(
                    "positions",
                    [
                        {
                            id: positionId,
                            name: SUPER_ADMIN_POSITION,
                            isExco: true,
                            createdAt: now,
                            updatedAt: now,
                            deletedAt: null
                        }
                    ],
                    { transaction }
                );
            } else {
                await queryInterface.bulkUpdate(
                    "positions",
                    { isExco: true, updatedAt: now },
                    { id: positionId },
                    { transaction }
                );
            }

            if (!existingUserRows[0]) {
                await queryInterface.bulkInsert(
                    "users",
                    [
                        {
                            id: userId,
                            name: "Super Admin",
                            email: SUPER_ADMIN_EMAIL,
                            password: passwordHash,
                            phoneNumber: "08000000000",
                            isActive: true,
                            createdAt: now,
                            updatedAt: now,
                            deletedAt: null
                        }
                    ],
                    { transaction }
                );
            }

            const [existingMemberRows] = await queryInterface.sequelize.query(
                `SELECT id FROM members WHERE "userId" = :userId LIMIT 1`,
                {
                    replacements: { userId },
                    transaction
                }
            );

            if (!existingMemberRows[0]) {
                await queryInterface.bulkInsert(
                    "members",
                    [
                        {
                            id: uuidv4(),
                            userId,
                            positionId,
                            isSuper: true,
                            gender: "male",
                            dateOfBirth: "1990-01-01",
                            createdAt: now,
                            updatedAt: now,
                            deletedAt: null
                        }
                    ],
                    { transaction }
                );
            } else {
                await queryInterface.bulkUpdate(
                    "members",
                    { positionId, isSuper: true, updatedAt: now },
                    { userId },
                    { transaction }
                );
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            const [userRows] = await queryInterface.sequelize.query(
                `SELECT id FROM users WHERE email = :email LIMIT 1`,
                {
                    replacements: { email: SUPER_ADMIN_EMAIL },
                    transaction
                }
            );

            const userId = userRows[0]?.id;

            if (userId) {
                await queryInterface.bulkDelete("members", { userId }, { transaction });
                await queryInterface.bulkDelete("users", { id: userId }, { transaction });
            }

            await queryInterface.bulkDelete(
                "positions",
                { name: SUPER_ADMIN_POSITION },
                { transaction }
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};