-- 建表语句

CREATE TABLE
    `TaskType` (
        `id` char(36) NOT NULL PRIMARY KEY,
        `name` varchar(255) NOT NULL,
        `userId` int NOT NULL,
        `color` varchar(255) NOT NULL
    );