CREATE TABLE
    countMeta (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        remark VARCHAR(255) DEFAULT '',
        createTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        userId VARCHAR(36)
                deletedAt DATETIME;
    );

CREATE TABLE
    countItem (
        id VARCHAR(36) PRIMARY KEY,
        remark VARCHAR(255) NOT NULL,
        createTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        countMetaId VARCHAR(36),
        deletedAt DATETIME;
    );


