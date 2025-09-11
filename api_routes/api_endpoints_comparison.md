# API Endpoints Comparison

This document compares the API endpoints defined in different files to identify and resolve conflicts.

## Endpoints in `api.py`

The main API application in `api.py` defines the following endpoints:

1. Knowledge management endpoints from `knowledge.router`
2. Tool management endpoints from `tools.router`
3. System endpoints from `system.router`
4. Core endpoints from `core.router`

## Endpoints in `api_routes/system.py`

This file defines system-level endpoints:

1. `/health` (GET)
2. `/is_active` (GET)
3. `/stop` (GET)

## Endpoints in `api_routes/core.py`

This file defines core functionality endpoints:

1. `/latest_answer` (GET)
2. `/query` (POST)
3. `/screenshot` (GET)
4. `/find_knowledge_tool` (POST)

## Removed Files

### `api_routes/query.py`

This file has been removed as it was no longer needed. It previously contained conflicting endpoints that were moved to other files.

## Endpoints in Other Route Files

### `api_routes/knowledge.py`

This file defines knowledge management endpoints with no conflicts:
- `/create_knowledge` (POST)
- `/delete_knowledge` (POST)
- `/update_knowledge` (POST)
- `/query_knowledge` (GET)
- `/query_public_knowledge` (GET)
- `/copy_knowledge` (POST)

### `api_routes/tools.py`

This file defines tool management endpoints with no conflicts:
- `/create_tool_and_knowledge` (POST)
- `/update_tool` (POST)
- `/delete_tool` (POST)
- `/query_tools` (GET)
- `/query_public_tools` (GET)
- `/get_tool_request` (POST)
- `/save_tool_response` (POST)

## Resolution Summary

1. Conflicting endpoints were removed from `api_routes/query.py` (which has now been deleted)
2. System-level endpoints (`/health`, `/is_active`, `/stop`) were moved to `api_routes/system.py`
3. Core functionality endpoints (`/latest_answer`, `/query`, `/screenshot`, `/find_knowledge_tool`) were moved to `api_routes/core.py`
4. All endpoints are now properly organized with no conflicts