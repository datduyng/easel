
const HeaderLayout: preact.FunctionComponent<{
}> = ({
  children,
}) => {
  return <div data-tauri-drag-region style={{
    height: '10vh'
  }}>
    {children}
  </div>
}

HeaderLayout.defaultProps = {
  __TYPE: "HeaderLayout"
}

export default HeaderLayout;