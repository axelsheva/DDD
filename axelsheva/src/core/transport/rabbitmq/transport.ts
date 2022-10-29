import amqp from 'amqp-connection-manager';
import { CONFIG } from '../config';

export const transport = amqp.connect(CONFIG.transport.url);
