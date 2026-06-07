export class OperationResult {
    public ok = false;
    public message: string = "";

    public succeeded(message?: string) {
        this.ok = true;
        if (message)
            this.message = message;
        else
            this.message = "operationSuccessful";
        return this;
    }

    public failed(message?: string) {
        this.ok = false;
        if (message)
            this.message = message;
        else
            this.message = "operationFailed";
        return this;
    }
}

export class OperationResultWithData<T> extends OperationResult {
    public data: T | null = null;

    public setData(data: T) {
        this.data = data;
        return this;
    }
}
