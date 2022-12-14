import clsx from 'clsx';

const CommonButton = (props: {
    variant?: 'primary' | 'light' | 'custom';
    // button props
    children: preact.ComponentChildren,
    onClick?: JSX.MouseEventHandler<HTMLButtonElement> | undefined,
    class?: string,
    tabIndex?: number,
    // the rest of button props
}) => {
    let buttonStyles = `inline-flex items-center text-sm 
          font-sm relative h-9 px-4 py-2.5 
          rounded-md border border-transparent 
          text-brand2-1100 bg-brand2-300 hover:bg-brand2-500 
          focus:outline-none`;

    if (props.variant === 'light') {
        buttonStyles = `inline-flex items-center justify-center gap-2
        text-sm
        relative h-9 px-2
        rounded-md
        text-brand2-1100 hover:bg-brand2-300 focus:outline-none`;
    } else if (props.variant === 'custom') {
        buttonStyles = '';
    } 


    return (
        <button
            class={clsx(buttonStyles, props.class)}
            onClick={props.onClick}
            tabIndex={props.tabIndex}
        >
            {props.children}
        </button>
    );
};

export default CommonButton;

