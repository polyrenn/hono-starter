declare global {
    namespace NodeJS {
      interface ProcessEnv {
        JWT_SECRET: string;
        NODE_ENV: 'development' | 'production';
        PORT?: string;
        PWD: string;
        AIRTABLE_TOKEN_KEY: string;
        AIRTABLE_TOKEN_ID: string;
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}