"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const POSITION_NAMES = [
    "Chairman",
    "President",
    "Vice President",
    "Secretary",
    "Welfare"
];

const PARISHES = [
    { name: "St. Peter Catholic Church", isDeanery: true },
    { name: "St. Anthony Catholic Church", isDeanery: false },
    { name: "St. Joseph Catholic Church", isDeanery: false }
];

const EDWARD = {
    name: "Edward",
    email: "edward.chairman@otadeanery.org",
    phoneNumber: "08011112222",
    password: "Password@123",
    gender: "male",
    dateOfBirth: "1992-05-20"
};

module.exports = {
    async up(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            const now = new Date();
            const passwordHash = await bcrypt.hash(EDWARD.password, 10);

            for (const positionName of POSITION_NAMES) {
                const [rows] = await queryInterface.sequelize.query(
                    `SELECT id FROM positions WHERE name = :name LIMIT 1`,
                    {
                        replacements: { name: positionName },
                        transaction
                    }
                );

                if (!rows[0]) {
                    await queryInterface.bulkInsert(
                        "positions",
                        [
                            {
                                id: uuidv4(),
                                name: positionName,
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
                        { id: rows[0].id },
                        { transaction }
                    );
                }
            }

            for (const parish of PARISHES) {
                const [rows] = await queryInterface.sequelize.query(
                    `SELECT id FROM parishes WHERE name = :name LIMIT 1`,
                    {
                        replacements: { name: parish.name },
                        transaction
                    }
                );

                if (!rows[0]) {
                    await queryInterface.bulkInsert(
                        "parishes",
                        [
                            {
                                id: uuidv4(),
                                name: parish.name,
                                isDeanery: parish.isDeanery,
                                createdAt: now,
                                updatedAt: now,
                                deletedAt: null
                            }
                        ],
                        { transaction }
                    );
                } else {
                    await queryInterface.bulkUpdate(
                        "parishes",
                        { isDeanery: parish.isDeanery, updatedAt: now },
                        { id: rows[0].id },
                        { transaction }
                    );
                }
            }

            const [chairmanRows] = await queryInterface.sequelize.query(
                `SELECT id FROM positions WHERE name = :name LIMIT 1`,
                {
                    replacements: { name: "Chairman" },
                    transaction
                }
            );

            const [stPeterRows] = await queryInterface.sequelize.query(
                `SELECT id FROM parishes WHERE name = :name LIMIT 1`,
                {
                    replacements: { name: "St. Peter Catholic Church" },
                    transaction
                }
            );

            const chairmanPositionId = chairmanRows[0]?.id;
            const stPeterParishId = stPeterRows[0]?.id;

            if (!chairmanPositionId || !stPeterParishId) {
                throw new Error("Required position/parish seed data was not created correctly.");
            }

            const [existingUserRows] = await queryInterface.sequelize.query(
                `SELECT id FROM users WHERE email = :email LIMIT 1`,
                {
                    replacements: { email: EDWARD.email },
                    transaction
                }
            );

            const userId = existingUserRows[0]?.id || uuidv4();

            if (!existingUserRows[0]) {
                await queryInterface.bulkInsert(
                    "users",
                    [
                        {
                            id: userId,
                            name: EDWARD.name,
                            email: EDWARD.email,
                            password: passwordHash,
                            phoneNumber: EDWARD.phoneNumber,
                            isActive: true,
                            approvalStatus: "approved",
                            createdAt: now,
                            updatedAt: now,
                            deletedAt: null
                        }
                    ],
                    { transaction }
                );
            } else {
                await queryInterface.bulkUpdate(
                    "users",
                    {
                        name: EDWARD.name,
                        phoneNumber: EDWARD.phoneNumber,
                        isActive: true,
                        approvalStatus: "approved",
                        updatedAt: now
                    },
                    { id: userId },
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
                            parishId: stPeterParishId,
                            positionId: chairmanPositionId,
                            isSuper: false,
                            gender: EDWARD.gender,
                            dateOfBirth: EDWARD.dateOfBirth,
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
                    {
                        parishId: stPeterParishId,
                        positionId: chairmanPositionId,
                        isSuper: false,
                        gender: EDWARD.gender,
                        dateOfBirth: EDWARD.dateOfBirth,
                        updatedAt: now
                    },
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
                    replacements: { email: EDWARD.email },
                    transaction
                }
            );

            const userId = userRows[0]?.id;

            if (userId) {
                await queryInterface.bulkDelete("members", { userId }, { transaction });
                await queryInterface.bulkDelete("users", { id: userId }, { transaction });
            }

            await queryInterface.sequelize.query(
                `
                DELETE FROM positions p
                WHERE p.name IN (:positionNames)
                  AND NOT EXISTS (
                    SELECT 1
                    FROM members m
                    WHERE m."positionId" = p.id
                  )
                `,
                {
                    replacements: { positionNames: POSITION_NAMES },
                    transaction
                }
            );

            await queryInterface.sequelize.query(
                `
                DELETE FROM parishes p
                WHERE p.name IN (:parishNames)
                  AND NOT EXISTS (
                    SELECT 1
                    FROM members m
                    WHERE m."parishId" = p.id
                  )
                `,
                {
                    replacements: { parishNames: PARISHES.map((p) => p.name) },
                    transaction
                }
            );

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
