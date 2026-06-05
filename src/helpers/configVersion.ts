import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Reads `package.json` (all or a single property)
 * 
 * Uses **sync** file system call
 */
export default function packageJsonReader(path: string): unknown | null;
export default function packageJsonReader(path: string, key: string): string;
export default function packageJsonReader(path: string, key?: string): string | unknown | null {
    try {
        const obj = JSON.parse((fs.readFileSync(path)).toString());
        if (key)
            return obj[key] as string;
        return obj;
    } catch {
        return key ? `unknown ${key}` : null;
    }
}

const cwd = process.cwd();

const isInsideProject = (() => {
    const parentDir = path.basename(path.dirname(cwd));
    return parentDir === 'projects' && (!fs.existsSync('./projects') || !fs.statSync('./projects').isDirectory());
})();

const rootDir = isInsideProject ? path.join(cwd, '../..') : cwd;
const projectsDir = path.join(rootDir, 'projects');

const projects = fs
    .readdirSync(projectsDir)
    .filter((file) => {
        const projectPath = path.join(projectsDir, file);
        const isDirectory = fs.statSync(projectPath).isDirectory();
        const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
        return isDirectory && hasPackageJson;
    });

export const projectsVersions = projects.map((project) => {
    const projectPath = path.join(projectsDir, project);
    const version = packageJsonReader(path.join(projectPath, 'package.json'), 'version');
    return { project, version };
});

export const projectVersion = packageJsonReader(path.join(rootDir, 'package.json'), 'version');
