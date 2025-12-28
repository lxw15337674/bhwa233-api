export const summaryTemplate = (title: string, content: string, ranking: string) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 24px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .content-wrapper {
            padding: 20px;
        }

        .main-content {
            margin-bottom: 20px;
        }

        .sidebar {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .section {
            margin-bottom: 20px;
            padding: 18px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .section h2 {
            color: #1a1a2e;
            font-size: 20px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
            display: flex;
            align-items: center;
        }

        .section h3 {
            color: #16213e;
            font-size: 18px;
            margin-bottom: 8px;
            margin-top: 12px;
        }

        .section p {
            color: #4a5568;
            line-height: 1.6;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .section ul {
            list-style: none;
            padding-left: 0;
            margin: 0;
        }

        .section li {
            color: #4a5568;
            padding: 4px 0;
            padding-left: 20px;
            position: relative;
            line-height: 1.5;
            font-size: 14px;
        }

        .section li:before {
            content: "▪";
            color: #667eea;
            font-size: 16px;
            position: absolute;
            left: 0;
            top: 4px;
        }

        .ranking-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 8px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .rank-number {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 12px;
            font-size: 13px;
        }

        .rank-number.top-1 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .rank-number.top-2 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .rank-number.top-3 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

        .rank-info {
            flex: 1;
        }

        .rank-name {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 14px;
        }

        .rank-count {
            color: #718096;
            font-size: 12px;
            margin-left: 8px;
        }

        .footer {
            text-align: center;
            padding: 16px;
            color: #718096;
            font-size: 12px;
            background: #f7fafc;
        }

        /* Markdown 样式 */
        h2:first-child {
            margin-top: 0;
        }

        code {
            background: #f7fafc;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            color: #e53e3e;
        }

        strong {
            color: #2d3748;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>

        <div class="content-wrapper">
            <div class="main-content">
                ${content}
            </div>

            ${ranking ? `
            <div class="sidebar">
                ${ranking}
            </div>
            ` : ''}
        </div>

        <div class="footer">
            由 AI 智能生成 • Powered by Claude
        </div>
    </div>
</body>
</html>
`;
