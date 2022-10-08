
const FooterLayout: preact.FunctionComponent = ({
  children
}) => {
  return <div data-tauri-drag-region style={{
    height: '10vh'
  }}>
    {children}
  </div>
}

FooterLayout.defaultProps = {
  __TYPE: "FooterLayout"
}

export default FooterLayout;