export default (warningMessage: string, condition: boolean) => {
    if (condition) {
        console.warn(`\n⚠ [WARNING] Config warn\n${warningMessage}\n`);
    }
};
