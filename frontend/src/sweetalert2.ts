type FireResult = {
    isConfirmed: boolean;
    isDismissed: boolean;
};

type FireFn = (...args: any[]) => Promise<FireResult>;

const fallbackFire: FireFn = async (arg1?: any, arg2?: any) => {
    const title = typeof arg1 === 'string' ? arg1 : (arg1?.title || 'Notice');
    const text = typeof arg1 === 'string' ? arg2 : arg1?.text;
    window.alert([title, text].filter(Boolean).join('\n\n'));
    return { isConfirmed: true, isDismissed: false };
};

const adapter = {
    fire: (...args: any[]) => {
        const boundFire = (window as any).__materialSwalFire as FireFn | undefined;
        return (boundFire || fallbackFire)(...args);
    }
};

export default adapter;

