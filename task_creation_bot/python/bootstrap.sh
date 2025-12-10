#!/bin/bash
export APP_ID=$APP_ID
export APP_SECRET=$APP_SECRET
export BASE_DOMAIN=${BASE_DOMAIN:-https://open.feishu.cn}
pip install -r requirements.txt
python main.py
