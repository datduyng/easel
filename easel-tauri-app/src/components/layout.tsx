import React from 'preact/compat';
import HeaderLayout from './header-layout';
import FooterLayout from './footer-layout';

export const typeOfComponent = (component: any) => component?.type?.().name;

export const getChildrenByType = (children: preact.ComponentChildren, types: any[]) =>
    React.Children.toArray(children).filter((child: any) => {
        return types.findIndex(c => child?.type == c) !== -1;
    });

export const getChildrenByTypeAndIgnore = (children: preact.ComponentChildren, ignoreTypes: any[]) =>
    React.Children.toArray(children).filter((child: any) => ignoreTypes.findIndex(c => child?.type == c) === -1);

const Layout: preact.FunctionalComponent = ({ children }) => {
    const headers = getChildrenByType(children, [HeaderLayout]);
    const footers = getChildrenByType(children, [FooterLayout]);
    return <div className={'flex flex-col h-full'}>
        {headers}
        <Hr />
        <div class="overflow-y-auto w-full relative mx-auto" style={{
            height: `calc(100vh - 10vh ${footers.length > 0 ? '- 10vh' : ''})`,
        }}>
            {getChildrenByTypeAndIgnore(children, [HeaderLayout, FooterLayout])}
        </div>
        {footers}
    </div>
}
export const Hr = () => {
    return <div class="bg-brand2-300 mx-2" style={{
        height: 1,
    }} />;
}

export default Layout;