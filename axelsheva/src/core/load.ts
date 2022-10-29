import { promises as fs } from 'fs';
import { createContext, Script } from 'node:vm';

const RUN_OPTIONS = { timeout: 5000, displayErrors: false };

export default async (filePath: string, sandbox: Record<string, any>) => {
    const src = await fs.readFile(filePath, 'utf8');
    const script = new Script(src);
    const context = createContext(Object.freeze({ ...sandbox }));
    const exported = script.runInContext(context, RUN_OPTIONS);
    return exported;
};
