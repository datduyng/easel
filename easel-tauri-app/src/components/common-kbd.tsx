
const CommonKbd = ({ children }: {
    children: preact.ComponentChildren
}) => {
    return (
        <kbd class="
            flex items-center justify-center
            bg-brand2-300 color-brand2-1100
            h-5 w-5
            rounded-sm 
        ">
            {children}
        </kbd>
    )
}

export default CommonKbd;