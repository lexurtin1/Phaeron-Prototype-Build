# Phaeron Pulse Prototype — AI Brief

This repository contains a prototype of the Phaeron Pulse platform. It is a working concept for a global order-routing intelligence workspace, not a finished product. The system combines interactive product demos, market research tooling, CRM account intelligence, and a set of planned AI-native experiences.

## Purpose

This file is written to brief an AI system on what the prototype does today and what it is intended to become. It explains each product page from a holistic user perspective and a deeply technical implementation perspective.

## Current Product Set

1. Network Overview
2. Market Research
3. Product Demo
4. Account Tracker
5. Agent Marketplace (Coming Soon)
6. Phaeron Intelligence (Coming Soon)
7. Market Movement (Coming Soon)

## Prototype Status

- The prototype is implemented as a folder-based client-side web app under `pulse/tools/`.
- Some features are fully interactive today, while others are placeholders with "Coming Soon" branding.
- The prototype is meant to show the desired product vision, including globe-based network visualization, AI-assisted note building, and product navigation.
- The AI capabilities are implemented using an Anthropic Claude integration via browser-side fetch calls and a local `config.js` file.

## 1. Network Overview

### Holistic description

Network Overview is a globe-based analytics experience for global mutual fund order routing. It visualizes country-level order flow and settlement corridors on a spinning 3D globe metaphor. Users can switch between order flow mode and settlement mode, inspect country-level metadata, and explore network health metrics like market opportunity, automation, and hub maturity.

### Technical description

- Implemented in `pulse/tools/network-overview/index.html` and `pulse/tools/network-overview/app.js`.
- Loads globe data from inline JSON variables such as `window.CALASTONE_FLOWS` and `window.CALASTONE_SETTLEMENTS`.
- Uses Anime.js from a CDN for animation effects and transitions.
- Builds a UI with maps, tooltips, filters, a research drawer, and a chat assistant.
- Supports two globe modes:
  - Network flows mode: visualizes order corridors, nodes, and cross-border routes.
  - Settlements mode: visualizes settlement corridors, trade volume, and positions.
- Uses `COUNTRY_DATA` and `COUNTRY_MARKDOWN` from `data/countries.js` to show country research snapshots.
- Stores user edits and note data in browser localStorage under `phaeron_atlas_v1` and supports export/import of JSON backups.
- Provides a research drawer that allows drop-zone file upload for AI note creation/editing.
- Uses a configurable Anthropics Claude API key loaded from `config.js`.
- Contains a chat assistant styled as the "Atlas Assistant" with Claude prompt wiring for conversational market insight.

## 2. Market Research

### Holistic description

Market Research is the AI-driven country research environment. It is built to help analysts capture and enrich market intelligence for mutual fund order routing, with structured scoring for opportunity, hub maturity, automation, and network presence.

### Technical description

- Implemented in `pulse/tools/market-research/index.html` and `pulse/tools/market-research/app.js`.
- Uses a Claude integration for two workflows:
  - Build a full country research note from an uploaded document.
  - Extract targeted order-routing intelligence from a document and propose structured markdown edits.
- Contains fixed system prompts in code that define exact JSON output and note format requirements.
- Supports file upload to Claude by reading files as base64 and sending them in the request payload.
- Uses the same `config.js` API key and `CLAUDE_MODEL` configuration pattern as the network overview.
- Includes a chat assistant experience named "Atlas Assistant" to answer questions about markets and infrastructure.
- Combines data-driven scoring with country metadata stored in `data/countries.js`.
- The page is primarily designed around research notes, country profiles, and AI-assisted drafting workflows.

## 3. Product Demo

### Holistic description

Product Demo is a visual explanation of the Phaeron network proposition. It shows how a hub-and-spoke network can replace point-to-point connectivity and includes an order routing mode that is conceptually meant to illustrate full routing flow.

### Technical description

- Implemented in `pulse/tools/product-demo/index.html` and `pulse/tools/product-demo/app.js`.
- Combines two main views:
  - Hub & Spoke visualization: an interactive SVG display of market participants and connections.
  - Order Routing mode: a hidden iframe that loads `Order Routing Flow - standalone.html` when activated.
- Includes animation and state transition logic using Anime.js for UI motion.
- The hub & spoke diagram is built entirely in client-side SVG with groups of participants, pulsating mesh lines, and toggled before/after states.
- The order routing flow uses an iframe loader with a loading spinner and mode strip for route/settlement controls.
- The product demo is intended as a pitch surface for how Phaeron can abstract complexity and make any message type interoperable.

## 4. Account Tracker

### Holistic description

Account Tracker is a sales intelligence dashboard focused on key accounts and pipeline signals. It presents account summaries, signal feeds, contacts, meeting details, and briefing text for go-to-market execution.

### Technical description

- Implemented in `pulse/tools/account-tracker/app.js` and `pulse/tools/account-tracker/index.html`.
- Maintains a static dataset of companies with signals, contacts, ownership, meetings, and briefing summaries.
- Renders interactive rows, filters, sparklines, and detail panels for each account.
- Signals are annotated with source types like Salesforce, Granola notes, call notes, news, CRM alerts, and market data.
- Uses JavaScript to build UI components from JSON-like objects and animate count-up values.
- The current implementation is a prototype sales dashboard to showcase pipeline intelligence rather than a connected CRM integration.

## 5. Agent Marketplace (Coming Soon)

### Holistic description

Agent Marketplace is planned as an AI agent discovery and deployment marketplace. The intended experience is to let users browse, install, and configure specialised assistants for tasks like email, CRM support, meeting preparation, and market monitoring.

### Technical description

- Implemented today as a placeholder page in `pulse/tools/agent-marketplace/index.html`.
- Contains a static hero screen with "Coming Soon" messaging and branding.
- The page is currently a prototype shell; the mechanics of browsing agents, composing prompts, or deploying agents are not yet implemented.
- It is included to represent a future direction for AI-driven automation within the Pulse ecosystem.

## 6. Phaeron Intelligence (Coming Soon)

### Holistic description

Phaeron Intelligence is intended to be the core AI insight layer for the platform. It will let users ask natural language questions about products, market conditions, and network opportunities.

### Technical description

- Implemented today as a placeholder page in `pulse/tools/phaeron-intelligence/index.html`.
- Contains a static hero with a "Coming Soon" badge and conceptual product description.
- The future implementation is expected to connect a conversational AI frontend with the same Claude integration patterns used elsewhere.
- For now, it exists to show the future product roadmap and to reserve the UI surface in the prototype.

## 7. Market Movement (Coming Soon)

### Holistic description

Market Movement is designed to surface live market and regulatory signals by country. It will help users monitor competitor activity, fund sector volatility, and opportunity triggers in real time.

### Technical description

- Implemented today as a placeholder page in `pulse/tools/market-movement/index.html`.
- Contains static content describing the product and a "Coming Soon" label.
- The page is currently a conceptual placeholder and does not include live data ingestion or analytics logic.

## Architecture and Data

- The overall prototype is a client-side web application with separate HTML/JS pages for each product.
- Shared design tokens are stored under `pulse/design-system/tokens/` and shared styles are in `pulse/design-system/base.css`.
- The main Pulse home page is `pulse/index.html` and it links to the product pages.
- `config.js` provides a single source of truth for the Anthropic API key and model configuration.
- The prototype uses browser localStorage for state persistence where needed and supports backup export/import.

## AI Integration Summary

- The prototype uses the Anthropic Claude REST API via browser-side `fetch` to `https://api.anthropic.com/v1/messages`.
- Claude prompts are embedded in JavaScript and specify exact structured output formats for note generation and extraction.
- The AI work is primarily focused on research note authoring, editing, and conversational assistance.
- The prototype also includes a dedicated research assistant chat UI in the Market Research and Network Overview experiences.

## Key Technical Intentions

- Show a visual, market-centric product narrative: globe analytics, hub/spoke networks, and order flow.
- Show how AI can enrich structured market research and support sales execution.
- Demonstrate a modular product ecosystem with analytic pages and a future agent marketplace.
- Preserve the prototype status: this is a concept implementation that illustrates the desired product vision.

## Notes for an AI Briefing System

- Treat this system as a proof-of-concept for a global mutual fund order-routing intelligence suite.
- Focus on the interactive globe, AI-assisted country note workflows, product demo narrative, and account intelligence use cases.
- Include the coming soon products as future roadmap placeholders, not as completed features.
- Highlight that `config.js` is sensitive and that Anthropic keys must be kept private.
