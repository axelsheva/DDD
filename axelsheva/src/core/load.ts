import { promises as fs } from 'fs';
import { createContext, Script } from 'node:vm';

export default (options: SandboxConfig) =>
    async (filePath: string, sandbox: Record<string, any>) => {
        const src = await fs.readFile(filePath, 'utf8');
        const script = new Script(src);
        const context = createContext(Object.freeze({ ...sandbox }));
        const exported = script.runInContext(context, options);
        return exported;
    };
