import React from 'react'
import { render, screen } from '@testing-library/react'
import Page from '../src/app/page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Page />)
    
    const heading = screen.getByText('Fitness Assistant')
    expect(heading).toBeTruthy()
  })

  it('renders navigation cards', () => {
    render(<Page />)
    
    expect(screen.getByText('Profile')).toBeTruthy()
    expect(screen.getByText('Workouts')).toBeTruthy()
    expect(screen.getByText('Meals')).toBeTruthy()
    expect(screen.getByText('AI Chat')).toBeTruthy()
  })
}) 

