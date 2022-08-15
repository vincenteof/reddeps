import React, { ComponentType } from 'react'

type MapStateToProps = (state: any) => Record<string, any>

type MapDispatchToProps = (
  dispatch: (action: Record<string, any>) => void
) => Record<string, any>

// https://medium.com/@jan.hesters/typescript-hoc-higher-order-component-and-decorators-in-react-586787f5a9e7
function connect(
  mapStateToProps: MapStateToProps | null,
  mapDispatchToProps?: MapDispatchToProps | null
): <P extends object>(WrappedComponent: ComponentType<P>) => void {
  return <P extends object>(Component: ComponentType<P>) =>
    class Decorated extends React.Component<P> {
      render() {
        return <Component {...this.props} />
      }
    }
}

export default connect
