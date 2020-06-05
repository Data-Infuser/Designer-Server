import { Application } from './app';
import controllers from './controllers';


new Application(controllers).setupDbAndServer();