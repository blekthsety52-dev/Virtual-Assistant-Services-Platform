import { createApiApp } from "../src/server/apiApp";

const app = createApiApp();

export const config = {
  api: {
    externalResolver: true
  }
};

export default app;
